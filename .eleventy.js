import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItPrism from 'markdown-it-prism';
import slugify from 'slugify';
import { minify as minifyCss } from 'csso';

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
  .use(markdownItPrism);

function walkDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      return walkDir(fullPath);
    }
    return stats.isFile() ? [fullPath] : [];
  });
}

function loadMarkdownCollection(subdir) {
  const baseDir = path.join(CONTENT_ROOT, subdir);
  return walkDir(baseDir)
    .filter((filePath) => filePath.endsWith('.md') || filePath.endsWith('.mdx'))
    .map((filePath) => {
      const raw = readFileSync(filePath, 'utf8');
      const parsed = matter(raw);
      const relativePath = path.relative(baseDir, filePath);
      const fallbackSlug = relativePath.replace(/\\.mdx?$/, '');
      const slug = slugifyString(parsed.data.slug || parsed.data.title || fallbackSlug);
      const published = parsed.data['date-published'] || parsed.data.date || parsed.data.publishedAt;
      const stats = readingTime(parsed.content);

      const tags = Array.isArray(parsed.data.tags)
        ? parsed.data.tags
        : parsed.data.tags
        ? [parsed.data.tags]
        : [];

      const data = {
        ...parsed.data,
        slug,
        tags,
        url: parsed.data.url || `/articles/${slug}/`,
        'date-published': published,
        'reading-meta': {
          text: stats.text,
          minutes: stats.minutes,
          words: stats.words
        }
      };

      return {
        id: slug,
        data,
        content: parsed.content,
        filePath,
        readingTime: stats
      };
    });
}

function loadJsonCollection(subdir) {
  const baseDir = path.join(CONTENT_ROOT, subdir);
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
    article.data.tags.forEach((tag) => {
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

function imageMarkup(src, options = {}) {
  if (!src) {
    return '';
  }

  const normalized = typeof options === 'string' ? { alt: options } : { ...options };
  const alt = normalized.alt || '';
  const className = normalized.class || '';
  const loading = normalized.loading || 'lazy';
  const decoding = normalized.decoding || 'async';
  const sizes = normalized.sizes;
  const width = normalized.width;
  const height = normalized.height;

  const attrs = [
    `src="${src}"`,
    `alt="${alt.replace(/"/g, '&quot;')}"`,
    `loading="${loading}"`,
    `decoding="${decoding}"`
  ];
  if (className) {
    attrs.push(`class="${className}"`);
  }
  if (sizes) {
    attrs.push(`sizes="${sizes}"`);
  }
  if (width) {
    attrs.push(`width="${width}"`);
  }
  if (height) {
    attrs.push(`height="${height}"`);
  }

  const img = `<img ${attrs.join(' ')} />`;

  const caption = normalized.caption;
  const credit = normalized.credit;
  if (!caption && !credit) {
    return img;
  }

  const captionParts = [];
  if (caption) {
    captionParts.push(`<span class="caption">${caption}</span>`);
  }
  if (credit) {
    captionParts.push(`<span class="credit">${credit}</span>`);
  }
  const figureClass = normalized.figureClass ? ` class="${normalized.figureClass}"` : '';
  return `<figure${figureClass}>${img}<figcaption>${captionParts.join(' · ')}</figcaption></figure>`;
}

export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget(CONTENT_ROOT);
  eleventyConfig.addPassthroughCopy({ assets: 'assets' });
  eleventyConfig.setLibrary('md', md);

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

  eleventyConfig.addFilter('slugify', slugifyString);

  eleventyConfig.addFilter('readingTime', (value) => {
    if (!value) return '';
    return readingTime(String(value)).text;
  });

  eleventyConfig.addFilter('markdown', (value) => {
    if (!value) return '';
    return md.render(String(value));
  });

  eleventyConfig.addFilter('cssmin', (code) => {
    if (!code) return '';
    return minifyCss(String(code)).css;
  });

  eleventyConfig.addFilter('readFile', (filePath) => {
    if (!filePath) return '';
    const normalized = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const absolute = path.join(process.cwd(), normalized);
    if (!existsSync(absolute)) return '';
    return readFileSync(absolute, 'utf8');
  });

  eleventyConfig.addShortcode('image', (src, options) => imageMarkup(src, options));
  eleventyConfig.addShortcode('coverImage', (src, options = {}) => {
    const normalized = typeof options === 'string' ? { alt: options } : { ...options };
    return imageMarkup(src, {
      ...normalized,
      loading: normalized.loading || 'lazy',
      figureClass: normalized.figureClass || 'cover-image-frame',
      class: normalized.class || 'cover-image'
    });
  });

  eleventyConfig.addShortcode('currentYear', () => String(new Date().getFullYear()));

  eleventyConfig.addCollection('articles', () => {
    const articles = loadMarkdownCollection('articles');
    return articles.sort((a, b) => {
      const aDate = new Date(a.data['date-published'] || 0);
      const bDate = new Date(b.data['date-published'] || 0);
      return bDate - aDate;
    });
  });

  eleventyConfig.addCollection('authors', () => loadJsonCollection('authors'));

  eleventyConfig.addCollection('publications', () => loadJsonCollection('publications'));

  eleventyConfig.addCollection('tags', () => {
    const articles = loadMarkdownCollection('articles');
    return buildTagIndex(articles);
  });

  eleventyConfig.addCollection('topics', () => loadJsonCollection('topics'));

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
