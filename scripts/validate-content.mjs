#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';

const root = process.cwd();

const articleRules = {
  requiredFrontmatter: [
    'title',
    'slug',
    'author-handle',
    'publication',
    'date-published',
    'updated-date',
    'excerpt',
    'cover-image',
    'reading-time',
    'tags',
    'status',
    'featured',
    'canonical-url',
    'version',
    'revision-history'
  ]
};

const authorRules = {
  requiredFields: ['id', 'handle', 'name', 'bio', 'avatar', 'social-links', 'settings']
};

const publicationRules = {
  requiredFields: ['id', 'name', 'slug', 'description', 'logo', 'founded-date', 'team']
};

const topicRules = {
  requiredFields: ['id', 'name', 'slug', 'description', 'parent-topic', 'meta']
};

const errors = [];

function walk(targetDir, matcher) {
  const entries = readdirSync(targetDir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matcher);
    } else if (matcher(fullPath)) {
      matcher.handle(fullPath);
    }
  });
}

function validateArticle(filePath) {
  const { data } = matter(readFileSync(filePath, 'utf8'));
  const missing = articleRules.requiredFrontmatter.filter((key) => !(key in data));
  if (missing.length) {
    errors.push(`${filePath}: missing frontmatter keys ${missing.join(', ')}`);
  }
  if (Array.isArray(data.tags)) {
    data.tags.forEach((tag) => {
      if (typeof tag !== 'string') {
        errors.push(`${filePath}: tag entries must be strings`);
      }
    });
  } else {
    errors.push(`${filePath}: tags must be an array`);
  }
  if (!Number.isInteger(data.version) || data.version < 1) {
    errors.push(`${filePath}: version must be a positive integer`);
  }
  if (data['revision-history']) {
    if (!Array.isArray(data['revision-history'])) {
      errors.push(`${filePath}: revision-history must be an array`);
    } else {
      data['revision-history'].forEach((entry, index) => {
        if (typeof entry !== 'object') {
          errors.push(`${filePath}: revision-history[${index}] must be an object`);
          return;
        }
        if (!('version' in entry)) {
          errors.push(`${filePath}: revision-history[${index}] missing version`);
        }
        if (!('updated-date' in entry)) {
          errors.push(`${filePath}: revision-history[${index}] missing updated-date`);
        }
      });
    }
  }
}

function validateJson(filePath, fields) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const missing = fields.filter((key) => !(key in data));
  if (missing.length) {
    errors.push(`${filePath}: missing fields ${missing.join(', ')}`);
  }
}

walk(path.join(root, 'content', 'articles'), Object.assign(
  (filePath) => filePath.endsWith('.md') || filePath.endsWith('.mdx'),
  { handle: validateArticle }
));

walk(path.join(root, 'content', 'authors'), Object.assign(
  (filePath) => filePath.endsWith('.json'),
  { handle: (filePath) => validateJson(filePath, authorRules.requiredFields) }
));

walk(path.join(root, 'content', 'publications'), Object.assign(
  (filePath) => filePath.endsWith('.json'),
  { handle: (filePath) => validateJson(filePath, publicationRules.requiredFields) }
));

walk(path.join(root, 'content', 'topics'), Object.assign(
  (filePath) => filePath.endsWith('.json'),
  { handle: (filePath) => validateJson(filePath, topicRules.requiredFields) }
));

if (errors.length) {
  console.error('\u274c Content validation failed:');
  errors.forEach((err) => console.error(` - ${err}`));
  process.exitCode = 1;
} else {
  console.log('\u2705 Content validation passed.');
}
