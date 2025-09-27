#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import MiniSearch from 'minisearch';

const distDir = path.join(process.cwd(), 'dist');
const dataPath = path.join(distDir, 'search-index.json');
const docsPath = path.join(distDir, 'search-docs.json');
const jsonFile = path.join(distDir, 'search-data.json');

function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function buildDocuments() {
  const data = readJSON(jsonFile);
  const docs = [];

  data.articles.forEach((article) => {
    docs.push({
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
    docs.push({
      id: `author:${author.id}`,
      type: 'author',
      title: author.name,
      subtitle: author.bio || '',
      content: author.bio || '',
      tags: author.interests.join(' '),
      author: author.name,
      url: `/authors/${author.handle}/`
    });
  });

  data.topics.forEach((topic) => {
    docs.push({
      id: `topic:${topic.id}`,
      type: 'topic',
      title: topic.name,
      subtitle: topic.description || '',
      content: topic.description || '',
      tags: topic.related.join(' '),
      author: '',
      url: `/topics/${topic.slug}/`
    });
  });

  return { data, docs };
}

function buildIndex(docs) {
  const miniSearch = new MiniSearch({
    fields: ['title', 'subtitle', 'content', 'tags', 'author'],
    storeFields: ['title', 'subtitle', 'type', 'url', 'tags', 'author'],
    searchOptions: {
      boost: { title: 3, subtitle: 1.5, content: 1 },
      fuzzy: 0.2,
      prefix: true
    }
  });
  miniSearch.addAll(docs);
  return miniSearch;
}

function compressIndex(index) {
  const raw = index.toJSON();
  return JSON.stringify(raw);
}

function main() {
  const { data, docs } = buildDocuments();
  mkdirSync(distDir, { recursive: true });
  const index = buildIndex(docs);
  const compressed = compressIndex(index);
  writeFileSync(dataPath, compressed);
  writeFileSync(docsPath, JSON.stringify(docs, null, 2));
  const bytes = Buffer.byteLength(compressed);
  if (bytes > 500_000) {
    throw new Error(`Search index size ${bytes} exceeds 500KB budget.`);
  }
  console.log(`Search index built with ${docs.length} documents (${(bytes / 1024).toFixed(1)} KB).`);
}

main();
