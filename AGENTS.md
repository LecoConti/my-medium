# Repository Guidelines

## Project Structure & Module Organization
- `content/` holds Markdown articles, author profiles, and policy pages; mirror front-matter schema in `prd-spec/tech-spec.md`.
- `assets/` stores pre-optimized media, CSS, and fonts; keep filenames kebab-case and commit only optimized variants.
- `site/` contains Eleventy layouts, partials, filters, and `_data/` collections—prefer small, reusable includes over monolithic templates.
- `scripts/` is reserved for automation such as `scripts/build-index.mjs`; document intent in header comments and keep scripts idempotent.
- `plan/` and `prd-spec/` stay the decision record; update them alongside structural or workflow changes.

## Build, Test, and Development Commands
- `npm install` bootstraps Eleventy and utilities; rerun after dependency updates.
- `npm run dev` (`npx @11ty/eleventy --serve`) serves the site at `http://localhost:8080` with live reload.
- `npm run build` generates the production `dist/` bundle; keep execution within Netlify’s minute budget.
- `node scripts/build-index.mjs --dry-run` validates search indexing whenever front-matter or content folders shift.
- `npm run lint` enforces ESLint/Prettier rules; warnings block merges.

## Coding Style & Naming Conventions
- Use 2-space indentation for JavaScript, Nunjucks, and JSON; wrap at 100 columns and rely on Prettier before commits.
- Favor ES modules, pure helpers, and descriptive filenames (`collect-tags.js`, `author-card.njk`).
- Front-matter keys stay lowercase kebab-case; article IDs follow `YYYY-MM-DD-slug` to keep chronological ordering stable.
- Keep CSS under `assets/styles/` with BEM-style selectors; confine page-specific tweaks to template includes.

## Testing Guidelines
- Every PR must pass `npm run lint` and `npm run build` locally or in CI before review.
- Compare generated HTML for major template edits (`npm run build` then inspect `dist/`).
- For new Eleventy collections or filters, add Jest coverage under `site/**/*.test.js` with representative fixtures.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat(content): add ai-strategy launch story`) and squash noisy WIP history.
- Reference related tasks from `plan/` or `prd-spec/` in the PR body and note Netlify config impacts.
- Include screenshots for UI changes and link preview deploys where relevant.
- Confirm manual smoke tests (`npm run dev`, `npm run build`) in the PR checklist and request at least one reviewer.

## Netlify & Security Notes
- Keep `netlify.toml` aligned with routing, headers, and function changes; describe updates in the PR.
- Monitor budgets after deploys (build minutes, bandwidth, function invokes) and flag anomalies in Slack or issues.
- Enforce CSP-friendly assets only and sanitize Markdown at build time before approving external content.
