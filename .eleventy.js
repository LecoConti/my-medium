import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItPrism from 'markdown-it-prism';

const CONTENT_ROOT = 'content';

const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
  .use(markdownItAnchor, {
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
      const slug = parsed.data.slug || relativePath.replace(/\\.mdx?$/, '');
      return {
        id: slug,
        data: parsed.data,
        content: parsed.content,
        filePath,
        readingTime: readingTime(parsed.content)
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
    const tags = Array.isArray(article.data.tags) ? article.data.tags : [];
    tags.forEach((tag) => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag).push(article);
    });
  });
  return Array.from(tagMap.entries()).map(([tag, items]) => ({ tag, items }));
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

  eleventyConfig.addFilter('readingTime', (value) => {
    if (!value) return '';
    return readingTime(String(value)).text;
  });

  eleventyConfig.addCollection('articles', () => {
    const articles = loadMarkdownCollection('articles');
    return articles.sort((a, b) => {
      const aDate = new Date(a.data.publishedAt || a.data.date || 0);
      const bDate = new Date(b.data.publishedAt || b.data.date || 0);
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
