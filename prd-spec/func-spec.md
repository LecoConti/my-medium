Here’s a **functional-only** specification for a Medium-like platform tailored for an internal community (you + colleagues). It’s structured as progressive releases so you can ship a minimal core, then add capabilities without rework. Each item is written to be immediately actionable by a developer (no tech stack assumptions).

# Product Name (placeholder)

“Compartilha” (rename anytime)

# Goals (functional)

* Make it effortless to **write, share, read, and discuss** articles internally.
* Provide **clean reading & writing experiences**, **simple distribution**, and **useful stats** (views, reads, read-ratio, referrals) inspired by Medium’s model of views/reads and stats pages. ([help.medium.com][1])
* Support **curation** (editor picks), **publications** (team magazines), and **feed distribution** as later releases. ([help.medium.com][2])

---

# Release Plan (progressive)

## R0 — Core MVP (Write → Publish → Read → Discuss)

**Purpose:** Ship the smallest end-to-end path for internal publishing.

### 1) Accounts & Roles

* **Account types:** Member (default), Editor (can feature stories within a publication starting R2), Admin (platform settings).
* **Auth:** Email-based sign-in.
* **Profile:** Name, handle (unique), bio (plain text), avatar, org/role, interests (tags).
* **Privacy:** Every member can read all published stories by default (internal network).

**Acceptance:**

* Create account, edit profile, sign in/out, delete account.

### 2) Writing Experience

* **Drafts:** Create, autosave, continue editing.
* **Editor capabilities:** Headings, bold/italic, quotes, code blocks, lists, links, inline images, cover image, inline callouts.
* **Metadata:** Title (required), subtitle (optional), tags (0–5), canonical link (optional), read-time estimate (auto).
* **Collaborators (view-only R0):** Share draft link for comments in R1 (commenting comes later).

**Acceptance:**

* Start a draft, add rich text + images, assign up to 5 tags, save.

### 3) Publishing

* **Visibility:** Internal (default).
* **URL:** Human-readable slug from title; collisions resolved by suffix.
* **Versioning:** Publishing creates **Story v1**; subsequent edits create **Story v2, v3…** with a simple change log (“what changed” text).
* **Unpublish:** Move story back to draft (URL redirects to draft notice for editors; 404 for non-authors).

**Acceptance:**

* Publish a draft → visible on profile and in the “Latest” feed.
* Update a published story → versions are tracked.

### 4) Reading Experience

* **Reader page:** Distraction-free layout, responsive, comfortable line-length + font size, estimated read time.
* **Navigation:** Previous/next story (same author), related by tag.
* **Inline features:** Copy link to section, share (internal link), bookmark.

**Acceptance:**

* Open story, navigate sections, bookmark a story.

### 5) Basic Discovery

* **Feeds:**

  * **Latest:** Reverse-chrono of all published stories.
  * **By Tag:** Reverse-chrono within tag.
* **Search:** Title + subtitle + tags.
* **Profiles:** Author page with bio, stories, tags.

**Acceptance:**

* Find a story by tag, by text, from “Latest”.

### 6) Social Interactions (Core)

* **Claps (simple):** 1–10 claps per member per story (client UI; aggregated count). (Medium uses claps as primary lightweight appreciation. We emulate the concept.) ([Medium][3])
* **Bookmarks:** Private list per user.
* **Responses (comments) — minimal:** One level (no threads yet). Edit within 5 minutes; delete anytime. (Medium emphasizes responses & comments as core interactions.) ([Blog HubSpot][4])
* **Notifications:** In-app bell for: someone clapped, commented, or followed you.

**Acceptance:**

* Clap (0–10), bookmark/unbookmark, post a response, receive notifications.

### 7) Basic Stats (per story & author)

* **Per story:** Views, Reads, Read Ratio (Reads / Views \* 100), Bookmarks, Claps. (Mirrors common Medium insights & definitions.) ([help.medium.com][1])
* **Per author:** Totals over last 30/90/all time.

**Acceptance:**

* See my story stats after publishing; author dashboard aggregates numbers.

---

## R1 — Collaboration, Draft Review, and Better Community

**Purpose:** Improve quality before publish; richer conversations after.

### 1) Draft Sharing & Private Review

* **Share draft for review:** Add reviewers by handle (internal).
* **Inline comments in draft:** Select text → comment (private to draft participants).
* **Resolve comments:** Mark resolved; keep a private audit trail.

**Acceptance:**

* Invite a colleague to comment on a draft; resolve all comments; publish.

### 2) Rich Responses

* **Threaded comments:** One sub-level thread.
* **@Mentions** within responses (notify mentioned member).
* **Moderation tools for authors:** Pin response, hide response (visible to author & responder), report to Admin.

**Acceptance:**

* Start a thread, mention a colleague, author pins a helpful response.

### 3) Advanced Profiles & Following

* **Follow author:** You get their new stories in **Following** feed.
* **Follow tags:** New stories appear in **For You** (basic personalization).

**Acceptance:**

* Follow author + tag; see following feed populate.

---

## R2 — Publications (Team “Magazines”) & Light Curation

**Purpose:** Create shared “containers” with editor workflows (akin to Medium publications and featured stories). ([help.medium.com][5])

### 1) Publications

* **Create publication:** Name, handle, description, logo, cover, tags.
* **Roles per publication:** Owner, Editor, Writer.
* **Submission flow:** Writer submits story to a publication; Editors review, request changes (inline draft comments), **accept & schedule** or **reject** with reason.
* **Home page:** Publication home shows logo, description, featured stories, latest.

**Acceptance:**

* Submit a story; editor requests changes; accept & schedule.

### 2) Featuring (“Editor’s Picks”)

* **Feature slotting:** Editors can mark up to N stories as **Featured**; they appear prominently on publication home & can push higher placement in feeds internally. (Parallel to Medium’s featured/boosted curation model at publication level.) ([help.medium.com][5])

**Acceptance:**

* Editor features a story; it appears in the featured section.

### 3) Editorial Calendar (Light)

* **Schedule:** Choose publish date/time for accepted submissions.
* **Queue view:** Editors see pipeline (submitted → in review → scheduled → published).

**Acceptance:**

* Schedule two stories; they publish in order automatically.

---

## R3 — Distribution, Curation & Discovery (Internal “Network”)

**Purpose:** Move from chronological feeds to curated discovery, similar to Medium’s algorithmic + human curation approach and distribution guidelines (scaled to your internal network). ([help.medium.com][2])

### 1) Personalized Feed (“For You” v1)

* **Signals:** Follows, tags, prior reads (implicit), bookmarks, claps.
* **Diversity guardrails:** Mix authors/tags to avoid filter bubbles.

**Acceptance:**

* A user with interests in “AI” and “Strategy” sees more of those, blended.

### 2) Internal Curation

* **Curators (role):** Admin-appointed curators can **boost** a story; boosted stories get temporary priority in feeds and email digests (see R4). (Inspired by Medium’s Boost/curation programs.) ([help.medium.com][6])
* **Curation notes:** Optional short reason for the boost shown on the story.

**Acceptance:**

* Curator boosts a story; it appears high in For You and “Editor’s Picks.”

### 3) Topics (Taxonomy)

* **Topics** are curated tag groups (e.g., “GenAI @ Work” combines tags “AI”, “LLM”, “RAG”).
* **Topic Hubs:** Landing pages with featured & latest stories for that topic.

**Acceptance:**

* Topic hub loads; shows featured + latest; subscribe to topic.

---

## R4 — Stats v2 & Digest Emails (Internal)

**Purpose:** Provide actionable analytics similar to Medium’s stats (views, reads, read-ratio) and simple email digests. ([help.medium.com][1])

### 1) Author & Publication Analytics

* **Author dashboard:**

  * Story table: Title, publish date, Views, Reads, Read Ratio, Claps, Bookmarks, Top tags.
  * Trends: 7/30/90-day deltas.
* **Story details:**

  * Daily chart of Views vs. Reads; Top traffic sources (internal locations: feed, publication, profile, tag hub).
  * Engagement funnel: Views → Reads → Bookmarks/Claps → Responses.
* **Publication dashboard:** Same, aggregated; top authors & stories.

**Acceptance:**

* Author sees read-ratio per story; publication editor sees top stories last 30 days.

### 2) Digest Emails (Internal Audience)

* **Daily/weekly digest:** New stories from followed authors/tags/publications + curator boosts; opt-in per user. (Medium uses email and app surfaces to distribute.) ([help.medium.com][2])
* **Per-story notifications:** Opt-in on publish for followers.

**Acceptance:**

* Opt into weekly digest; receive one with boosted & followed content.

---

## R5 — Knowledge Reuse & Reader Utilities

**Purpose:** Help readers extract value from reading (a known Medium differentiator: highlights). ([Blog HubSpot][4])

### 1) Highlights & Private Notes

* **Highlights:** Select text → **Highlight**. Appears in a private “Highlights” page for that user.
* **Private notes:** Add a note to a highlight; searchable in “My Notes.”
* **Share highlights:** Copy link to paragraph/section (internal only).

**Acceptance:**

* User highlights a key paragraph; finds it later on the Highlights page.

### 2) Collections (Reading Lists)

* **Create named collections:** e.g., “AI Strategy Examples”.
* **Add stories** to a collection from story page.
* **Share collection** internally (view-only link).

**Acceptance:**

* Create a collection; add/remove stories; share link with team.

---

## R6 — Governance, Safety & Quality

**Purpose:** Keep discourse healthy and content consistent with internal policies (parallels Medium’s community moderation tooling).

### 1) Reporting & Moderation

* **Report content/response:** Reasons (harassment, confidential info, spam, copyright).
* **Moderation queue:** Admins see reports by severity; actions: hide, warn author, require edits, remove, or escalate.
* **Audit log:** Actions recorded (who/when/what/why); visible to Admins.

**Acceptance:**

* Member reports a story; Admin reviews & hides it; author is notified.

### 2) Policy Pages

* **House rules** (editable page).
* **Attribution guidance** for quotes, images, sources.

**Acceptance:**

* Policy appears in footer; authors see link before publishing.

---

## R7 — Publications v2: Team Workflows

**Purpose:** Strengthen editorial operations for teams.

### 1) Submission Templates & Checklists

* **Custom sections at submission:** Summary, target reader, key takeaways.
* **Checklists:** “Reviewed by legal,” “Approved by manager” (checkboxes captured in metadata).

**Acceptance:**

* Publication requires checklist; submission blocked until all checks pass.

### 2) Cross-Publication Syndication

* **Share to other publications:** Editors can request or accept cross-posting; canonical stays in the origin pub; shows “Also appears in …”.

**Acceptance:**

* Editor shares a story to a second publication; appears in both.

---

## R8 — Optional Monetization & Access Controls (If You Ever Go Beyond Internal)

*(Optional; skip if strictly internal.)*

* **Member tiers:** Reader (free), Supporter (can “tip” or sponsor publication), Organization (private space).
* **Paywalled stories:** Mark story as open / members-only.
* **Earnings page:** If enabled, show story earnings tied to engagement time (Medium’s Partner Program concept is based on member reading time & engagement). ([Medium][7])

**Acceptance:**

* Mark a story members-only; non-members see preview.

---

# Cross-Cutting Functional Details

## Content Model (functional)

* **Story:** {id, title, subtitle, body (structured blocks), cover, tags\[], authorId, publicationId?, status: draft/published/unpublished, versions\[], publishedAt, updatedAt, readTime, canonicalUrl?, featured? (by pub), boosted? (by curator), scheduledAt?}
* **Response:** {id, storyId, parentId?, authorId, body, createdAt, editedUntil}
* **Highlight:** {id, storyId, userId, textRangeRef, note?}
* **Collection:** {id, ownerId, name, description?, storyIds\[]}
* **Stats (per story):** {views, reads, readRatio, claps, bookmarks, responses} (aligns with Medium-style metrics and read ratio definition). ([help.medium.com][1])
* **Publication:** {id, name, handle, description, logo, cover, tags\[], roles{userId: role}, featuredStoryIds\[], workflowConfig}
* **Curation:** {storyId, curatorId, reason, boostedUntil}

## Permissions (functional)

* **Authors**: CRUD own drafts; publish; unpublish own stories; moderate responses on own stories.
* **Editors (publication)**: Review submissions; comment on drafts; schedule/feature; request changes; publish within the publication.
* **Curators**: Boost any story; add a curation note.
* **Admins**: Platform settings; moderation; manage roles.

## Feeds (functional)

* **Latest** (global), **Following** (authors), **By Tag**, **For You** (signals), **Publication Home**, **Topic Hubs**.
* Each feed item: title, subtitle, author, pub (if any), tags, read time, publish date, engagement (claps/bookmarks).

## Notifications (functional)

* **Events:** new follower, new story by followed author/publication, mentions, comments on your story, replies to your comment, boosts, publication decisions.
* **Controls:** per event on/off; digest frequency.

## Search (functional)

* **Scope:** Stories (title/subtitle/tags/author/publication), People, Publications, Collections.
* **Filters:** Tags, publication, author, date.

## Accessibility & Internationalization (functional)

* Keyboard navigable editor & reader; alt text for images; readable color contrast.
* Language per user profile; story language metadata (for future filtering).

---

# Non-Functional *Behavioral* Notes (still functional in spirit)

* **Editor autosave:** every few seconds; unsaved-changes warning on exit.
* **Read time:** based on word count + media adjustment; display at top.
* **Tagging discipline:** max 5 tags; suggest popular tags as you type (existing tag list).
* **Versioning behavior:** every publish event creates a new immutable snapshot; show “Updated on …” badge if not v1.
* **Comment civility:** rate-limit responses to reduce spam; author tools to hide.

---

# Example User Journeys (acceptance flow)

1. **MVP publish (R0):**
   Alex writes → adds 3 tags → publishes → story appears in **Latest** → colleagues clap & comment → Alex sees Views/Reads/Read Ratio next day.

2. **Draft review (R1):**
   Alex invites Ana to review draft → inline comments resolved → publish → @mentions in responses for follow-up.

3. **Publication workflow (R2):**
   Alex submits to “AI Strategy” publication → Editor asks for clearer summary via draft comments → accepts & schedules for Monday → features the story on pub home.

4. **Curation (R3/R4):**
   Curator boosts Alex’s piece → it tops colleagues’ **For You** feed → appears in weekly digest → Read Ratio improves week-over-week on the author dashboard.

---

# What’s explicitly **not** in scope yet

* External sign-ups or public internet distribution (unless you later enable R8).
* Complex WYSIWYG page design (stick to clean article format like Medium). ([TechRadar][8])
* Deep SEO controls, custom domains (not needed internally; Medium also keeps low customization). ([TechRadar][8])

---

# Why this plan / Explanation

* **Start with fundamentals**: An internal Medium alternative only needs *writing, publishing, reading, and basic interaction* to be useful. That’s the whole R0.
* **Borrow proven patterns**: We mirror Medium’s **clean editor**, **claps**, **responses**, **tags**, and **stats** (views, reads, read-ratio) because they’re simple and effective signals; the definitions are widely understood and documented. ([Blog HubSpot][4])
* **Quality before reach**: R1 adds **draft review**, which drives better articles without adding distribution complexity.
* **Scalable structure**: R2 brings **publications** and **featuring**, enabling team-level curation with clear roles—again, a battle-tested model. ([help.medium.com][5])
* **Thoughtful distribution**: R3/R4 implement **personalized feeds**, **curation/boosts**, and **digests**—mirroring Medium’s algorithmic + human blend that increases discovery without chaos. ([help.medium.com][2])
* **Reader value capture**: R5’s **highlights/notes/collections** turns reading into reusable knowledge (a Medium hallmark: highlights). ([Blog HubSpot][4])
* **Trust & safety**: R6’s governance keeps the space healthy and aligned with company norms.
* **Editorial maturity**: R7 equips publications with **templates/checklists/syndication** for repeatable quality.
* **Optionality**: R8 leaves the door open for monetization or protected access if you ever expand beyond internal audiences; the structure mirrors Medium’s member/Partner ideas but remains optional. ([Medium][7])

This sequence lets you **ship value fast**, **improve quality**, **scale discovery**, and **govern**—in that order—while staying close to a model users already understand.

[1]: https://help.medium.com/hc/en-us/articles/215108608-Stats?utm_source=chatgpt.com "Stats"
[2]: https://help.medium.com/hc/en-us/articles/360018677974-What-happens-to-your-story-when-you-publish-on-Medium?utm_source=chatgpt.com "What happens to your story when you publish on Medium"
[3]: https://medium.com/blog/what-you-can-do-with-medium-3d1e847e366c?utm_source=chatgpt.com "What you can do with Medium"
[4]: https://blog.hubspot.com/marketing/how-to-use-medium?utm_source=chatgpt.com "How to Use Medium: What I Learned from Writing, Publishing & Promoting on the Platform"
[5]: https://help.medium.com/hc/en-us/articles/28221990368791-How-to-feature-a-story-in-your-publication?utm_source=chatgpt.com "How to feature a story in your publication"
[6]: https://help.medium.com/hc/en-us/articles/360006362473-Medium-s-Distribution-Guidelines-How-curators-review-stories-for-Boost-General-and-Network-Distribution?utm_source=chatgpt.com "Medium's Distribution Guidelines: How curators review ..."
[7]: https://medium.com/partner-program?utm_source=chatgpt.com "Medium Partner Program"
[8]: https://www.techradar.com/pro/website-building/medium-review?utm_source=chatgpt.com "Medium review 2025"
