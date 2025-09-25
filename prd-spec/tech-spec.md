Here’s an **actionable technical specification** optimized to keep the web site within **Netlify Free** limits (100 GB/month bandwidth, \~300 build minutes/month, \~125k function invocations/month, \~1 M edge function invocations/month, 10 GB storage) and with guardrails to avoid surprise upgrades. ([Netlify][1])

I organized it by: **(A)** baseline architecture & budgets, **(B)** content format & indexing, **(C)** release-by-release implementation plan (technical), and **(D)** ops & limits.

---

# A) Baseline Architecture (Jamstack, static-first)

**Primary goals:** 1) serve mostly static assets (HTML/CSS/JS), 2) do *build-time* work (indexing, feeds) to minimize runtime compute, 3) keep dynamic features optional and very cheap.

**Decisions**

* **Site generator:** **Eleventy (11ty)** for fast, zero-client framework overhead, and easy Markdown pipelines.
* **Rendering mode:** **SSG only** (no SSR). HTML prebuilt, shipped from Netlify CDN.
* **Auth (small team, internal):** Start **invite-only Netlify Identity** *only if you need login*. Otherwise, ship R0 without auth. Identity (GoTrue) still works but is **deprecated**—fine for small internal usage; avoid external growth on it. ([Netlify Docs][2])

  * If Identity is off: show all content publicly; authoring happens via Git (branch/PR).
  * If Identity is on later: lock “Write” UI + gated features behind login; keep usage within free plan.
* **Dynamic features:** Prefer **client-side** (bookmarks → `localStorage`). For server state (comments/claps) use **Netlify Forms / Functions** with strict budgets (see D).
* **Search:** **Build-time index + client-side search (Lunr.js or MiniSearch)**; ship a compact JSON index (see B). Avoid APIs/search backends. ([Lunr][3])
* **Media:** keep images small, pre-optimized in the build (sharp/11ty-img). No heavy image CDNs or transforms at runtime.

**Repository layout**

```
/content/            # Markdown articles, publications, topics, policy pages
/assets/             # images, css, fonts
/site/               # Eleventy input: layouts, shortcodes, filters, data
/site/_data/         # global data (tags, topics, publications)
/functions/          # (R1+) minimal Netlify Functions (if enabled)
/scripts/            # build scripts: indexer, sitemap, rss, stats aggregator (local)
/netlify.toml        # redirects, headers, functions & edge config, build commands
```

**Netlify config (starter)**

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

# Security/Perf headers
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self';"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "no-referrer-when-downgrade"
    Cache-Control = "public, max-age=31536000, immutable"

# Redirects for clean URLs
[[redirects]]
  from = "/@*:handle/story/:slug/"
  to   = "/authors/:handle/:slug/"
  status = 200
```

---

# B) Content Format & Indexing (actionable)

## Article storage format

**File format:** **Markdown (.md or .mdx)** with **YAML front-matter**. Example:

```markdown
---
id: "2025-09-25-gpt5-compare"
title: "GPT-5 Pro vs. GPT-5 Thinking"
subtitle: "When to use which"
author: "alex"
publication: "ai-strategy"   # optional
tags: ["ai","search","strategy"]
status: "published"          # draft|published|unpublished
publishedAt: "2025-09-25T14:30:00-03:00"
updatedAt: "2025-09-25T17:12:00-03:00"
readTimeMinutes: 9           # computed in build if absent
version: 2                   # increment on publish
canonicalUrl: null
coverImage: "/assets/ai/cover.png"
language: "en"
---
Article body in Markdown...
```

**Where stored:** `/content/articles/YYYY/MM/slug.md`
**Images:** committed under `/assets/…` (pre-optimized during build).
**Profiles:** `/content/authors/alex.json` (bio, avatar, links).
**Publications:** `/content/publications/ai-strategy.json`.
**Topics:** `/content/topics/genai.json`.
**Policies:** `/content/policy/house-rules.md`.

### Author file (JSON)

```json
{
  "id": "alex",
  "name": "Alex Conti",
  "handle": "alex",
  "bio": "Tech consultant...",
  "avatar": "/assets/people/alex.jpg",
  "interests": ["ai","strategy","modernization"]
}
```

### Publication file (JSON)

```json
{
  "id": "ai-strategy",
  "name": "AI Strategy",
  "handle": "ai-strategy",
  "description": "Internal publication on AI & business.",
  "logo": "/assets/pubs/ai-strategy-logo.svg",
  "cover": "/assets/pubs/ai-strategy-cover.jpg",
  "roles": { "alex": "owner", "ana": "editor" },
  "featured": ["2025-09-25-gpt5-compare"]
}
```

## Indexing strategy (client-side search, build-time)

**Indexer script (`/scripts/build-index.mjs`)**

1. Read all published Markdown files.
2. Extract fields: `id, title, subtitle, tags, author, publication, publishedAt, updatedAt, excerpt (first 40–60 words), url`.
3. Tokenize/normalize (fold diacritics, lowercase).
4. Build a **compact JSON** for the browser (two files):

   * `/search/index.json` → **documents metadata** (no full body).
   * `/search/lunr.json` (or `/search/minisearch.json`) → **search index**.

**Size budget:** aim **≤ 500 KB** total index; chunk by **month** or **topic** when exceeding \~1 MB to keep search snappy on slow networks. ([Aaron Luna][4])

**Search library:**

* Default: **MiniSearch** (smaller) or **Lunr.js** (mature). Avoid leading wildcards for perf. ([Lunr][3])

**On-page search UI:** vanilla JS: load the smallest relevant index file(s) on first keystroke; debounce 150 ms; show top-10 results.

---

# C) Release-by-Release Technical Plan (low-resource)

## R0 — Core MVP (static only)

**Pages built at build time (SSG)**

* Home (`/`): list from content FS.
* Author (`/authors/:handle/`), Story (`/authors/:handle/:slug/`), Tags (`/tags/:tag/`), Search (`/search/` with client-side index), Bookmarks (client-side), Notifications (hidden/placeholder), Settings (static forms; no backend).
* **Bookmarks:** client-side in `localStorage` (`bookmarks:[storyId]`).
* **Claps:** **defer** in R0 (or simulate client-side only for demo).
* **Responses (comments):** either **off** in R0 or use **Netlify Forms** (simple, non-threaded) with a small monthly cap (100 submissions on some plans; watch limits). ([Netlify Support Forums][5])

**Authoring workflow (no backend):**

* Write in Markdown files → PR → merge triggers Netlify build via Git.
* **Build steps:** `npm run clean && eleventy && node scripts/build-index.mjs && npm run optimize-assets`.
* **Caching:** cache `node_modules`, image thumbnails, and index artifacts.

**Why this stays free:** pure static hosting + occasional builds; zero server invocations during reading.

---

## R1 — Collaboration & Community (light dynamics, still frugal)

**Draft sharing & inline comments:**

* Keep **editorial collaboration in Git** to stay free: use PR comments for “inline review”.
* If you *must* do in-app review: enable **Netlify Identity (invite-only)** for a handful of reviewers; store draft comments using a **single Netlify Function** + a **flat JSON file** in Git (commit via GitHub API) or a tiny external free KV (Deta Base or Cloudflare KV free). Keep below 125k monthly function calls. ([Netlify][6])

**Threaded responses & @mentions (public story page):**

* Minimal path: continue Netlify Forms (non-threaded).
* If threads are required: one Netlify Function `comments.js` reading/writing a JSON file in repo (batched writes) or KV. Cache GET responses with `Cache-Control: s-maxage=300`.
* Rate-limit per IP (30 req/5min typical for Identity; mimic this server-side). ([Netlify Support Forums][7])

**Follow (authors/tags):**

* Client-side only first: store user’s follows in `localStorage` and render a “Following” filtered view with existing static data. (Real server follows can come later.)

---

## R2 — Publications & Light Curation (static + metadata)

* Model publications as **JSON files** under `/content/publications/*.json`.
* **Submission flow (cheap):** authors set `publication: "ai-strategy"` in article front-matter and open a **PR** (or a “submit” page that creates a PR via GitHub OAuth—optional).
* **Featured stories:** maintain `featured[]` array in publication JSON; surfaced statically during builds.
* **Editorial queue UI:** static page reading repo state via GitHub API **only for authenticated editors** (Netlify Identity gating) using a **client-side call to GitHub GraphQL** from editor browsers (no server cost).

---

## R3 — Personalized Distribution & Curation

* **For You (cheap v1):** entirely **client-side**—rank with a simple scoring function based on the user’s local follows + last 7 days recency. No server.

* **Curator boost:** add `curation.json` under `/content/_data/` with entries `{storyId, boostedUntil, reason}`; build reads this and surfaces a “Curated” badge. Editors update via PR (or a tiny function to write curation JSON).

* **Topic hubs:** just static pages generated from topic JSON.

---

## R4 — Stats v2 & Digests (minimal telemetry)

* **Author dashboard:** generate **static CSV/JSON** counters at build time only from **log-free proxies** (cheap path: none) → **Recommendation:** start with **local counters only** (bookmarks/claps from client are not reliable).
* If you need real stats:

  * Use **Netlify Analytics** (paid) **or** add a **privacy-friendly client beacon** that writes to a single Netlify Function which **samples** events (e.g., 1/10 requests) to a daily JSON file. Keep under 125k function invocations/month. ([Netlify][6])
* **Digests:** avoid emails initially; render a static “This Week for You” page (client-side using local follows). Add email later via a GitHub Action + Mailgun free (outside Netlify) if needed.

---

## R5 — Highlights, Notes & Collections

* **Highlights/notes:** client-side only (per user in `localStorage`) to avoid server cost.
* **Collections:** store in `localStorage` initially; optional export/import (JSON download/upload) so people can share a file manually.

---

## R6 — Governance, Safety & Quality

* **Report content:** Netlify Form “report” goes to Submissions table and email notification (watch the 100 submissions/month cap on some plans). If you exceed caps, fallback to GitHub Issues (client opens an issue in a private repo). ([Netlify Support Forums][5])
* **Moderation queue:** static admin page reading Forms or Issues via API (client-side for logged-in Admins). Actions = edits to content via PR.

---

## R7 — Templates, Checklists, Syndication

* **Submission template/checklist:** validate at **build time** via a script that fails the build if required fields unchecked in front-matter (`checklist: {legal:true, manager:true}`), keeping runtime cost at zero.
* **Syndication:** duplicate a story’s front-matter `alsoAppearsIn: ["other-publication"]`; build renders on both publication pages.

---

## R8 — (Optional) Monetization & Access

* If you go external later: restrict access via **Edge Functions** or Next Middleware equivalents. Mind Edge **50 ms CPU per request** & bundle size limits (keep guards simple). ([Netlify Docs][8])

---

# D) Ops, Limits & Budgets (so you remain free)

**Netlify Free plan reference:** \~100 GB bandwidth/mo, \~300 build minutes/mo, \~125k function reqs/mo, \~1 M edge function invocations/mo, \~10 GB storage. Free has *hard* limits; it won’t bill you automatically. ([Netlify][1])

**Budgets (practical):**

* **Builds:** target **< 1 min per 100 articles** (Eleventy + simple index). 2–4 deploys/week ⇒ < 20–40 mins/month baseline.
* **Bandwidth:** a 50 KB HTML + 150 KB CSS/JS + small index (≤ 500 KB) \~ **700 KB first view**.

  * 100 GB/month supports \~**150k page views** at 700 KB each (rough math).
* **Functions:** keep at **0/mo** initially. If you enable comments/claps via Functions, budget **< 5k/mo**.
* **Forms:** beware **100 submissions/month** ceiling in some contexts; switch to GitHub Issues or a tiny KV if you outgrow Forms. ([Netlify Support Forums][5])
* **Search index size:** keep **≤ 500 KB**; chunk by month/topic after \~1 MB. ([Aaron Luna][4])

**Performance checklist**

* Inline **critical CSS**; defer non-critical JS.
* Add `Cache-Control: immutable` for hashed assets (set in `netlify.toml`).
* Pre-compress (`.br`, `.gz`) at build.
* Generate responsive images at build (11ty-img) and use `loading="lazy"`.
* Avoid large client frameworks; prefer vanilla or Preact if needed (tiny).

**Security**

* CSP (as above), no inline `<script>` except hashed if necessary.
* Sanitize Markdown via build (e.g., `rehype-sanitize`).
* If Identity is enabled, protect admin/editor routes client-side + server checks in Functions (if any).

**Monitoring**

* Turn on Netlify usage notifications (50/75/90/100%). **Free plan is hard-limited**; it will stop rather than charge. ([Netlify][1])

---

## Minimal task list to start (R0)

1. **Repo & 11ty**

   * `npm init -y && npm i @11ty/eleventy gray-matter reading-time minisearch`
   * Add layouts, filters (date, read-time), collections (by tag, by author).
2. **Content**

   * Create `/content/authors/alex.json` and 3 sample articles under `/content/articles/2025/09/…`.
3. **Indexer (`/scripts/build-index.mjs`)**

   * Read Markdown, extract metadata, write `/dist/search/index.json` (docs) and `/dist/search/minisearch.json` (index).
4. **Templates**

   * Home, Story, Author, Tag, Search page with client-side MiniSearch.
5. **Assets**

   * Add CSS (no framework), tiny JS for search and bookmarks (in `localStorage`).
6. **Netlify**

   * Add `netlify.toml`; connect repo; first deploy.
7. **Build optimization**

   * Cache `.cache` and `node_modules` between builds; pre-optimize images once.

---

## When you later need dynamic features

* **Comments (threaded) & claps (real counts):**

  * One **Netlify Function** `comments.js` handling `GET (list)/POST (create)` with a **single JSON file** per story (≤ 50 KB).
  * Use **ETags** + **conditional GET** and a `s-maxage=300` CDN cache.
  * For claps, store a **daily tally file** to minimize write amplification.
  * Keep invocations **< 5k/mo** at small scale.

* **Identity (if enabled):**

  * Set **Invite-only**; keep monthly active users small; recognize Identity is **deprecated** for new projects (OK for internal). ([Netlify Docs][2])
  * Apply client rate limits & server-side throttling similar to Identity’s historic guidance (≈30 req/5 min/IP). ([Netlify Support Forums][7])

---

# Why this design

* **Static-first = almost free to run.** Pages and feeds are generated at build time, so **reads cost \$0** compute. Netlify Free’s limits easily cover a small internal network (100 GB bandwidth, 300 build minutes). ([Netlify][1])
* **Content in Markdown + front-matter** keeps authoring simple, versioned, and reviewable—no database to run or pay for.
* **Search without servers**: a **build-time index** + **client-side search** (MiniSearch/Lunr) gives instant UX and no monthly API cost. Keep the index ≤ 500 KB (chunk beyond 1 MB). ([Aaron Luna][4])
* **Optional dynamics** (comments/claps) sit behind tiny Functions or Forms with explicit monthly budgets (and fallbacks) to keep you inside the free envelope. Functions & Edge have generous free invocation caps if you later need them. ([Netlify][6])
* **Release alignment:** Each release from your functional spec maps to a cheap technical approach first (Git/PR workflows, static curation), and only moves to server features when the team truly needs them.

If you want, I can turn this into a **`netlify.toml` + Eleventy starter repo** with a working indexer and sample content, or export this spec as a **PDF** like the previous docs.

[1]: https://www.netlify.com/blog/introducing-netlify-free-plan/?utm_source=chatgpt.com "Introducing Netlify's Free plan"
[2]: https://docs.netlify.com/manage/security/secure-access-to-sites/identity/overview/?utm_source=chatgpt.com "Authenticate users with Netlify Identity"
[3]: https://lunrjs.com/guides/searching.html?utm_source=chatgpt.com "Searching"
[4]: https://aaronluna.dev/blog/add-search-to-static-site-lunrjs-hugo-vanillajs/?utm_source=chatgpt.com "Add Search to Your Static Site with Lunr.js (Hugo, Vanilla JS)"
[5]: https://answers.netlify.com/t/over-100-form-submissions-on-free-tier/16006?utm_source=chatgpt.com "Over 100 Form submissions on free tier? - Admin"
[6]: https://www.netlify.com/platform/core/functions/?utm_source=chatgpt.com "Netlify Functions"
[7]: https://answers.netlify.com/t/identity-rate-limits/16702?utm_source=chatgpt.com "Identity rate limits?"
[8]: https://docs.netlify.com/build/edge-functions/limits/?utm_source=chatgpt.com "Edge Functions limits"
