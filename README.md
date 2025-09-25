# My Medium

Static-first publishing prototype built with Eleventy and Minisearch to support an internal Medium-style content workflow. The project follows the Netlify-friendly architecture defined in `prd-spec/tech-spec.md` and the contributor expectations captured in `AGENTS.md`.

## Getting Started

1. Ensure Node.js 18+ is installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the local development server (http://localhost:8080):
   ```bash
   npm run dev
   ```
4. Produce a production-ready build in `dist/`:
   ```bash
   npm run build
   ```
5. Verify content schemas remain valid:
   ```bash
   node scripts/validate-content.mjs
   ```

## Project Layout

```
content/    # Markdown articles, authors, policies
assets/     # Optimized media, styles, fonts
site/       # Eleventy layouts, includes, filters, data
scripts/    # Build and indexing automation
functions/  # (Optional) Netlify Functions for dynamic features
```

Refer to `AGENTS.md` for detailed contribution guidelines and to `prd-spec/` for architectural context.

## Deployment

- Netlify deploys run `npm run build` and publish `dist/` as configured in `netlify.toml`.
- Set the production site to use Node.js 18 and enable automatic HTTPS; the config already applies CSP and security headers.
- After connecting the GitHub repository in Netlify, trigger a deploy preview to confirm redirects and headers are active.
