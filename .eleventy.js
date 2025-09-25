import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItPrism from 'markdown-it-prism';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItToc from 'markdown-it-toc-done-right';
import Image from '@11ty/eleventy-img';
import slugify from 'slugify';

const projectRoot = process.cwd();
const CONTENT_ROOT = 'content';
const slugifyOptions = {
  lower: true,
  strict: true,
  remove: /[()'"!@#$%^&*+=?:;.,<>`~]/g
};

const slugifyString = (value) => slugify(String(value || '').trim(), slugifyOptions);

const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
  .use(markdownItAnchor, {
    slugify: slugifyString,
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: 'after',
      class: 'direct-link',
      symbol: '#'
    })
  })
  .use(markdownItToc, {
    level: [2, 3],
    slugify: slugifyString,
    listType: 'ul'
  })
  .use(markdownItFootnote)
  .use(markdownItPrism);

function walkDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkDir(fullPath);
    }
    return entry.isFile() ? [fullPath] : [];
  });
}

const slugRegistry = new Set();

function registerSlug(source, fallback, namespace = 'article') {
  const base = slugifyString(source || fallback || `${namespace}-${slugRegistry.size + 1}`) || `${namespace}-${slugRegistry.size + 1}`;
  let candidate = base;
  let suffix = 2;
  while (slugRegistry.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  slugRegistry.add(candidate);
  return candidate;
}

function computeReadingStats(content) {
  const base = readingTime(content);
  const html = md.render(content);
  const imageCount = (html.match(/<img\b/gi) || []).length;
  const codeBlocks = (html.match(/<pre><code/gi) || []).length;
  const blockQuotes = (html.match(/<blockquote/gi) || []).length;

  const imageSeconds = imageCount ? 12 + (imageCount - 1) * 11 : 0;
  const codeSeconds = codeBlocks * 5;
  const quoteSeconds = blockQuotes * 4;
  const totalMinutes = base.minutes + (imageSeconds + codeSeconds + quoteSeconds) / 60;

  return {
    minutes: totalMinutes,
    words: base.words,
    text: `${Math.max(1, Math.round(totalMinutes || 1))} min read`
  };
}

async function generateImageHTML(src, alt = '', sizes = '100vw', widths = [400, 800, 1200]) {
  if (!src) return '';
  const isRemote = /^https?:/i.test(src);
  const normalizedSrc = isRemote ? src : path.join(projectRoot, src.replace(/^\//, ''));
  const metadata = await Image(normalizedSrc, {
    widths,
    formats: ['avif', 'webp', 'jpeg'],
    urlPath: '/assets/images/',
    outputDir: path.join(projectRoot, 'dist', 'assets', 'images'),
    sharpOptions: {
      animated: true
    }
  });

  return Image.generateHTML(metadata, {
    alt,
    sizes,
    loading: 'lazy',
    decoding: 'async'
  });
}

function loadMarkdownArticles() {
  const baseDir = path.join(CONTENT_ROOT, 'articles');
  if (!existsSync(baseDir)) return [];

  return walkDir(baseDir)
    .filter((filePath) => filePath.endsWith('.md') || filePath.endsWith('.mdx'))
    .map((filePath) => {
      const raw = readFileSync(filePath, 'utf8');
      const parsed = matter(raw);
      const relativePath = path.relative(baseDir, filePath);
      const fallbackSlug = relativePath.replace(/\\.mdx?$/, '');
      const slug = registerSlug(parsed.data.slug || parsed.data.title, fallbackSlug);
      const publishedDate = parsed.data['date-published'] || parsed.data.date || parsed.data.publishedAt;
      const version = Number.isFinite(parsed.data.version) ? parsed.data.version : 1;
      const updatedDate = parsed.data['updated-date'] || publishedDate;
      const revisionHistory = Array.isArray(parsed.data['revision-history'])
        ? parsed.data['revision-history']
        : [
            {
              version,
              'updated-date': updatedDate || publishedDate,
              notes: 'Initial import'
            }
          ];

      const readingStats = computeReadingStats(parsed.content);

      return {
        id: slug,
        slug,
        data: {
          ...parsed.data,
          slug,
          version,
          'date-published': publishedDate,
          'updated-date': updatedDate,
          'revision-history': revisionHistory,
          publishedAt: publishedDate,
          url: parsed.data.url || `/articles/${slug}/`,
          'reading-meta': readingStats
        },
        content: parsed.content,
        filePath,
        readingTime: readingStats
      };
    })
    .sort((a, b) => {
      const aDate = new Date(a.data['date-published'] || 0);
      const bDate = new Date(b.data['date-published'] || 0);
      return bDate - aDate;
    });
}

function loadJsonCollection(subdir) {
  const baseDir = path.join(CONTENT_ROOT, subdir);
  if (!existsSync(baseDir)) return [];
  return walkDir(baseDir)
    .filter((filePath) => filePath.endsWith('.json'))
    .map((filePath) => {
      const raw = readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      const relativePath = path.relative(baseDir, filePath);
      const id = data.id || relativePath.replace(/\\.json$/, '');
      return { id, data, filePath };
    });
}

function buildTagIndex(articles) {
  const tagMap = new Map();
  articles.forEach((article) => {
    const tags = Array.isArray(article.data.tags) ? article.data.tags : [];
    tags.forEach((tag) => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag).push(article);
    });
  });
  return Array.from(tagMap.entries()).map(([tag, items]) => ({
    tag,
    slug: slugifyString(tag),
    items
  }));
}

let cachedArticles = null;

function getArticles() {
  if (!cachedArticles) {
    cachedArticles = loadMarkdownArticles();
  }
  return cachedArticles;
}

export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget(CONTENT_ROOT);
  eleventyConfig.addWatchTarget('assets/images');
  eleventyConfig.addPassthroughCopy({ assets: 'assets' });
  eleventyConfig.setLibrary('md', md);

  eleventyConfig.on('beforeBuild', () => {
    slugRegistry.clear();
    cachedArticles = null;
  });

  eleventyConfig.addFilter('slugify', slugifyString);
  eleventyConfig.addFilter('readableDate', (value, locale = 'en-US', options = {}) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      ...options
    });
    return formatter.format(date);
  });

  eleventyConfig.addFilter('readingTime', (value) => {
    if (!value) return '';
    const stats = computeReadingStats(String(value));
    return stats.text;
  });

  eleventyConfig.addFilter('readingStats', (value) => {
    if (!value) return {};
    return computeReadingStats(String(value));
  });

  eleventyConfig.addAsyncShortcode('image', generateImageHTML);
  eleventyConfig.addAsyncShortcode('coverImage', (src, alt = '', sizes = '(max-width: 960px) 100vw, 960px') =>
    generateImageHTML(src, alt, sizes, [640, 960, 1440])
  );
  eleventyConfig.addNunjucksAsyncShortcode('image', generateImageHTML);
  eleventyConfig.addNunjucksAsyncShortcode('coverImage', (src, alt = '', sizes = '(max-width: 960px) 100vw, 960px') =>
    generateImageHTML(src, alt, sizes, [640, 960, 1440])
  );

  eleventyConfig.addCollection('articles', () => getArticles());

  eleventyConfig.addCollection('authors', () => loadJsonCollection('authors'));
  eleventyConfig.addCollection('publications', () => loadJsonCollection('publications'));
  eleventyConfig.addCollection('topics', () => loadJsonCollection('topics'));
  eleventyConfig.addCollection('tags', () => buildTagIndex(getArticles()));

  return {
    dir: {
      input: 'site',
      includes: '_includes',
      data: '_data',
      output: 'dist'
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    templateFormats: ['njk', 'md', 'html']
  };
}
