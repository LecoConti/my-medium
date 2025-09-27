import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
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
import { minify as minifyCss } from 'csso';
import MiniSearch from 'minisearch';

const projectRoot = process.cwd();
const CONTENT_ROOT = 'content';
const IMAGE_INPUT_DIR = 'assets/images';
const IMAGE_OUTPUT_DIR = path.join(projectRoot, 'dist', 'assets', 'images');
const IMAGE_URL_PATH = '/assets/images';
const IMAGE_WIDTHS = [320, 640, 960, 1280, 1920];
const IMAGE_FORMATS = ['avif', 'webp', 'jpeg'];
const IMAGE_CACHE_OPTIONS = {
  duration: '30d',
  directory: '.cache/eleventy-img'
};

Image.concurrency = 6;

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

function resolveImageSource(src) {
  if (!src) {
    throw new Error('Image source is required.');
  }

  if (/^https?:\/\//i.test(src)) {
    const url = new URL(src);
    const pathname = url.pathname || 'remote-image';
    const name = slugifyString(path.parse(pathname).name || 'remote');
    const outputSubdir = path.posix.join('remote', url.hostname || 'external');
    return {
      inputPath: src,
      outputSubdir,
      urlPath: `${IMAGE_URL_PATH}/${outputSubdir}`,
      fileSlug: name
    };
  }

  const normalizedSrc = src.startsWith('/') ? src.slice(1) : src;
  const absolutePath = path.join(projectRoot, normalizedSrc);

  if (!existsSync(absolutePath)) {
    throw new Error(`Image not found at ${src}`);
  }

  const posixPath = normalizedSrc.replace(/\\/g, '/');
  const relativePath = posixPath.startsWith(`${IMAGE_INPUT_DIR}/`)
    ? posixPath.slice(`${IMAGE_INPUT_DIR}/`.length)
    : posixPath;
  const outputSubdir = path.posix.dirname(relativePath) === '.' ? '' : path.posix.dirname(relativePath);
  const fileSlug = slugifyString(path.parse(relativePath).name);
  const urlPath = outputSubdir ? `${IMAGE_URL_PATH}/${outputSubdir}` : IMAGE_URL_PATH;

  return {
    inputPath: absolutePath,
    outputSubdir,
    urlPath,
    fileSlug
  };
}

async function getImageMetadata(src, options = {}) {
  const {
    widths = IMAGE_WIDTHS,
    formats = IMAGE_FORMATS,
    outputSubdir,
    urlPath,
    fileSlug,
    cacheOptions = IMAGE_CACHE_OPTIONS
  } = options;

  const source = resolveImageSource(src);
  const finalOutputSubdir = outputSubdir ?? source.outputSubdir;
  const finalUrlPath = urlPath ?? source.urlPath;
  const finalSlug = fileSlug ?? source.fileSlug;
  const outputDir = finalOutputSubdir
    ? path.join(IMAGE_OUTPUT_DIR, finalOutputSubdir)
    : IMAGE_OUTPUT_DIR;

  const metadata = await Image(source.inputPath, {
    widths,
    formats,
    outputDir,
    urlPath: finalOutputSubdir ? `${IMAGE_URL_PATH}/${finalOutputSubdir}` : IMAGE_URL_PATH,
    useCache: true,
    cacheOptions,
    sharpOptions: {
      animated: true
    },
    sharpWebpOptions: {
      quality: 58
    },
    sharpAvifOptions: {
      quality: 45
    },
    sharpJpegOptions: {
      quality: 68,
      progressive: true,
      chromaSubsampling: '4:4:4'
    },
    filenameFormat: (id, srcPath, width, format, { hash }) => {
      const parsed = path.parse(srcPath);
      const base = slugifyString(parsed.name || finalSlug || id);
      return `${base}-${hash}-${width}w.${format}`;
    }
  });

  return metadata;
}

async function generateResponsiveImage(src, options = {}) {
  const normalized = typeof options === 'string' ? { alt: options } : { ...options };
  const alt = (normalized.alt || '').trim();
  if (!alt) {
    throw new Error(`Image shortcode for ${src} requires an alt description.`);
  }

  const metadata = await getImageMetadata(src, {
    widths: normalized.widths || IMAGE_WIDTHS,
    formats: normalized.formats || IMAGE_FORMATS,
    outputSubdir: normalized.outputSubdir,
    fileSlug: normalized.fileSlug,
    urlPath: normalized.urlPath
  });

  const sizes = normalized.sizes || '100vw';
  const imgClass = normalized.class || normalized.imgClass || '';
  const figureClass = normalized.figureClass || '';
  const loading = normalized.loading || 'lazy';
  const decoding = normalized.decoding || 'async';
  const fetchpriority = normalized.fetchpriority;

  const imageAttributes = {
    alt,
    sizes,
    loading,
    decoding
  };
  if (imgClass) {
    imageAttributes.class = imgClass;
  }
  if (fetchpriority) {
    imageAttributes.fetchpriority = fetchpriority;
  }

  const html = Image.generateHTML(metadata, imageAttributes, {
    whitespaceMode: 'inline'
  });

  const caption = normalized.caption;
  const credit = normalized.credit;
  const figure = normalized.figure ?? Boolean(caption || credit);

  if (!figure) {
    return html;
  }

  const captionParts = [];
  if (caption) {
    captionParts.push(`<span class="caption">${caption}</span>`);
  }
  if (credit) {
    captionParts.push(`<span class="credit">${credit}</span>`);
  }
  const figcaption = captionParts.length ? `<figcaption>${captionParts.join(' · ')}</figcaption>` : '';
  const figureClassAttr = figureClass ? ` class="${figureClass}"` : '';

  return `<figure${figureClassAttr}>${html}${figcaption}</figure>`;
}

let cachedArticles = null;

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
          'reading-meta': readingStats,
          'author-name': parsed.data['author-name'] || parsed.data.author || parsed.data['author-handle'] || ''
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
      const normalized = slugifyString(tag);
      if (!tagMap.has(normalized)) {
        tagMap.set(normalized, {
          tag,
          slug: normalized,
          items: []
        });
      }
      tagMap.get(normalized).items.push(article);
    });
  });
  return Array.from(tagMap.values());
}

function getArticles() {
  if (!cachedArticles) {
    cachedArticles = loadMarkdownArticles();
  }
  return cachedArticles;
}

function getSearchData(articles, authors, topics) {
  return {
    articles: articles.map((article) => ({
      slug: article.slug,
      title: article.data.title,
      excerpt: article.data.excerpt || '',
      content: article.content,
      tags: Array.isArray(article.data.tags) ? article.data.tags : [],
      author: article.data['author-name'] || article.data.author || '',
      url: article.data.url
    })),
    authors: authors.map((author) => ({
      id: author.id,
      handle: author.data.handle || author.id,
      name: author.data.name || author.id,
      bio: author.data.bio || '',
      interests: Array.isArray(author.data.interests) ? author.data.interests : []
    })),
    topics: topics.map((topic) => ({
      id: topic.id,
      slug: topic.data.slug || topic.id,
      name: topic.data.name || topic.id,
      description: topic.data.description || '',
      related: Array.isArray(topic.data.related) ? topic.data.related : []
    }))
  };
}

function buildSearchIndex(data) {
  const documents = [];

  data.articles.forEach((article) => {
    documents.push({
      id: `article:${article.slug}`,
      type: 'article',
      title: article.title,
      subtitle: article.excerpt,
      content: article.content,
      tags: article.tags.join(' '),
      author: article.author,
      url: article.url
    });
  });

  data.authors.forEach((author) => {
    documents.push({
      id: `author:${author.id}`,
      type: 'author',
      title: author.name,
      subtitle: author.bio,
      content: author.bio,
      tags: author.interests.join(' '),
      author: author.name,
      url: `/authors/${author.handle}/`
    });
  });

  data.topics.forEach((topic) => {
    documents.push({
      id: `topic:${topic.id}`,
      type: 'topic',
      title: topic.name,
      subtitle: topic.description,
      content: topic.description,
      tags: topic.related.join(' '),
      author: '',
      url: `/tags/${topic.slug}/`
    });
  });

  const miniSearch = new MiniSearch({
    fields: ['title', 'subtitle', 'content', 'tags', 'author'],
    storeFields: ['title', 'subtitle', 'type', 'url', 'tags', 'author'],
    searchOptions: {
      boost: { title: 3, subtitle: 2, content: 1 },
      fuzzy: 0.2,
      prefix: true
    }
  });

  miniSearch.addAll(documents);
  return {
    index: miniSearch.toJSON(),
    docs: documents
  };
}

export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget(CONTENT_ROOT);
  eleventyConfig.addWatchTarget(path.join('assets', 'images'));
  eleventyConfig.addWatchTarget(path.join('assets', 'styles'));
  eleventyConfig.addPassthroughCopy({ assets: 'assets' });
  eleventyConfig.addPassthroughCopy({ 'node_modules/minisearch/dist/minisearch.umd.js': 'assets/vendor/minisearch.js' });
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
    return readingTime(String(value)).text;
  });

  eleventyConfig.addFilter('readingStats', (value) => {
    if (!value) return {};
    return computeReadingStats(String(value));
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

  eleventyConfig.addAsyncShortcode('image', (src, options) => {
    const normalized = typeof options === 'string' ? { alt: options } : { ...(options || {}) };
    return generateResponsiveImage(src, {
      ...normalized,
      figure: normalized.figure ?? Boolean(normalized.caption || normalized.credit)
    });
  });
  eleventyConfig.addNunjucksAsyncShortcode('image', (src, options) => {
    const normalized = typeof options === 'string' ? { alt: options } : { ...(options || {}) };
    return generateResponsiveImage(src, {
      ...normalized,
      figure: normalized.figure ?? Boolean(normalized.caption || normalized.credit)
    });
  });

  eleventyConfig.addAsyncShortcode('coverImage', (src, options = {}) => {
    const normalized = typeof options === 'string' ? { alt: options } : { ...options };
    return generateResponsiveImage(src, {
      ...normalized,
      widths: normalized.widths || [640, 960, 1280, 1920],
      sizes: normalized.sizes || '(max-width: 960px) 100vw, 960px',
      class: normalized.class || 'cover-image',
      figure: normalized.figure ?? Boolean(normalized.caption || normalized.credit),
      figureClass: normalized.figureClass || 'cover-image-figure'
    });
  });
  eleventyConfig.addNunjucksAsyncShortcode('coverImage', (src, options = {}) => {
    const normalized = typeof options === 'string' ? { alt: options } : { ...options };
    return generateResponsiveImage(src, {
      ...normalized,
      widths: normalized.widths || [640, 960, 1280, 1920],
      sizes: normalized.sizes || '(max-width: 960px) 100vw, 960px',
      class: normalized.class || 'cover-image',
      figure: normalized.figure ?? Boolean(normalized.caption || normalized.credit),
      figureClass: normalized.figureClass || 'cover-image-figure'
    });
  });

  eleventyConfig.addShortcode('currentYear', () => String(new Date().getFullYear()));

  eleventyConfig.addCollection('articles', () => getArticles());
  eleventyConfig.addCollection('authors', () => loadJsonCollection('authors'));
  eleventyConfig.addCollection('publications', () => loadJsonCollection('publications'));
  eleventyConfig.addCollection('topics', () => loadJsonCollection('topics'));
  eleventyConfig.addCollection('tags', () => buildTagIndex(getArticles()));

  eleventyConfig.addCollection('search', () => {
    const articles = getArticles();
    const authors = loadJsonCollection('authors');
    const topics = loadJsonCollection('topics');
    const searchData = getSearchData(articles, authors, topics);
    const searchPayload = buildSearchIndex(searchData);
    const outputDir = path.join(process.cwd(), 'dist');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(path.join(outputDir, 'search-data.json'), JSON.stringify(searchData));
    writeFileSync(path.join(outputDir, 'search-index.json'), JSON.stringify(searchPayload.index));
    writeFileSync(path.join(outputDir, 'search-docs.json'), JSON.stringify(searchPayload.docs));
    return searchPayload;
  });

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
