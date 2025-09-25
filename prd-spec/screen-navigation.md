Global patterns (apply to all releases)

Header (global): Logo → /; Search; “Write” (if logged in); Notifications; Profile menu (Profile, Bookmarks, Settings, Sign out).

Footer (global): About, House Rules (R6), Help.

URL rules: Use lowercase, hyphenated slugs. IDs for drafts/private pages.

States: empty, loading, error, success, and no-permission states defined for each screen.

Roles: Member (default), Editor (pub-scoped, from R2), Curator (R3), Admin (platform-wide).

R0 — Core MVP (Write → Publish → Read → Discuss)
Sitemap

/ Home (Latest)

/login

/signup

/@handle Author Profile

/@handle/story/slug Story (Reader)

/write Draft Editor (new)

/write/:draftId Draft Editor (existing)

/search?q=

/tags/:tag

/bookmarks (mine)

/notifications

/settings/profile

/settings/account

/* 404

Screens & routes
1) Home (Latest) — /

Purpose: Reverse-chrono feed of all stories.
States:

empty: “No stories yet.”

success: List items show title, subtitle, author, publish date, tags, read time, clap/bookmark counts.
Actions: Click to open Story; filter by Tag chip; paginate/infinite scroll.

2) Login — /login / Signup — /signup

Purpose: Email sign-in/sign-up.
States: success, error.

3) Profile — /@handle

Purpose: Author bio + stories.
Sections: Bio, social (optional), list of stories (Published), filter by Tag.
Actions: Follow (R1+), message (not in scope), View bookmarks (own only).

4) Draft Editor — /write and /write/:draftId

Purpose: Create/edit drafts with autosave.
Regions: Title, Subtitle, Body (blocks), Cover, Tags, Canonical URL (optional), Read time (computed).
Actions: Publish; Save (autosave); Delete draft.
Guards: Unsaved-changes dialog on navigate away.

5) Publish flow (inline modal on editor)

Purpose: Set visibility (Internal), confirm tags, generate slug.
Result: Redirect to Story (Reader).

6) Story (Reader) — /@handle/story/slug

Purpose: Distraction-free reading.
Sections: Title, Subtitle, Byline, Read time, Body, Tags, Related by Tag, Author card.
Actions: Clap (1–10), Bookmark, Copy link (section anchor), Share (internal link), Add Response (flat).
States:

version-badge: “Updated on …” if v>1.

unpublished/404: If removed.

7) Search — /search?q=

Purpose: Search titles/subtitles/tags.
Filters: Tags.
States: empty (no results), success.

8) Tag Hub — /tags/:tag

Purpose: Reverse-chrono within tag.
Actions: Follow tag (R1+).

9) Bookmarks — /bookmarks

Private list; remove/manage.

10) Notifications — /notifications

Claps, responses, follows (follows start R1).

11) Settings — /settings/profile, /settings/account

Edit profile, avatar, handle; account deletion.

R0 Primary Flows (text flowchart)
[Home /] 
  -> click "Write" -> [Draft Editor /write] 
      -> (Autosave draftId) 
      -> "Publish" -> [Publish Modal] 
          -> confirm -> [Story /@me/story/slug] 
              -> "Edit Story" -> [Draft Editor /write/:draftId] (creates v2 on publish)

[Story] 
  -> Clap 1–10 
  -> Bookmark -> [Bookmarks] 
  -> Add Response (flat)

[Profile /@handle] -> open story
[Search /search?q=] -> open story
[Tag /tags/:tag] -> open story

R1 — Collaboration & Better Community
New/changed routes

/write/:draftId/share Draft Sharing Panel (modal or drawer)

Inline comments in Draft Editor (no new route)

Threaded Responses on Story

Follow feeds (new feed tab)

Mentions in responses

Screen deltas
Draft Editor (updated)

Right panel “Share for review”: add reviewers by handle; link copy; permission badges.

Inline comments: text selection → “Comment”; side comment thread; “Resolve”.

Draft activity: list open/resolved comments.

Story (Reader) — threaded responses

Response tree: one sub-level.

@mention in responses; autocomplete handles.

Home (add tabs)

Tabs: Latest (default), Following (authors you follow).

Follow controls appear on Profile and Author card.

Profile (updated)

Follow button; shows follower/following counts.

Following feed accessible from Home tab.

R1 Flows
[Draft Editor]
  -> "Share for review" -> add @ana -> [Draft shared]
  -> @ana selects text -> adds comment -> [Inline thread]
  -> Author "Resolve" -> "Publish" -> [Story]

[Story]
  -> Add Response -> reply (thread)
  -> type "@an..." -> mention -> [Notification to @ana]

[Profile /@handle]
  -> "Follow" -> [Following feed tab shows this author's new stories]

R2 — Publications & Light Curation
New routes

/pub/:handle Publication Home

/pub/:handle/settings (owner/editor)

/submit/:storyId Submission screen (or modal)

/pub/:handle/queue Editorial Queue (editor view)

New/updated screens
Publication Home — /pub/:handle

Sections: Logo/cover/description; Featured stories; Latest; Authors.
Roles: Owner, Editor, Writer.
Actions: Follow Pub (feed impact R3+); View submission guidelines.

Submission Flow — /submit/:storyId

Purpose: Writer submits a story to a pub.
Fields: Note to editor (optional).
Result: In Queue as submitted.

Editorial Queue — /pub/:handle/queue (Editors)

Columns: Submitted → In Review → Scheduled → Published.
Actions: Open draft in review mode, add inline comments, Request changes, Accept, Schedule (date/time), Reject (reason).
Feature toggle: Mark as Featured (appears on Pub Home).

Draft Review (editor view)

Same editor with comment permissions; “Decision” bar: Accept / Request Changes / Reject.

R2 Flows
[Story (author)]
  -> "Submit to publication" -> [Submission /submit/:storyId]
      -> "Submit" -> [Pub Queue /pub/:h/queue] (state: Submitted)

[Editor /pub/:h/queue]
  -> open submission -> [Review draft]
      -> "Request changes" -> back to author (notification)
      -> or "Accept" -> "Schedule" -> [Queue: Scheduled]
      -> "Feature" -> [Pub Home: Featured section]

[Publication Home /pub/:h]
  -> click Featured -> [Story]

R3 — Personalized Distribution & Curation
New/changed routes

/ Home tabs now: For You, Latest, Following, By Tag

/topics/:topic Topic Hub

Curation actions (curators) live on Story/Admin panels

New/updated screens
Home (updated)

For You tab: personalized ranking from signals (follows, reads, bookmarks, claps).

Diversity guardrails (functional behavior).

Boosted stories display a “Curated” badge + note.

Curation Panel (curator-only action)

On Story admin strip: “Boost” with reason and expiration.

Topic Hub — /topics/:topic

Purpose: Curated collection of tags; shows Featured & Latest within topic.
Actions: Subscribe to Topic (affects For You and Digest in R4).

R3 Flows
[Curator opens Story]
  -> "Boost" -> set reason + until -> [Story shows Curated badge]
  -> [Home / For You] -> boosted story appears near top

[User]
  -> Visit /topics/genai -> "Subscribe" -> [For You contains more from topic]

R4 — Stats v2 & Digests
New/changed routes

/stats Author Dashboard

/stats/story/:storyId Story Details

/pub/:handle/stats Publication Dashboard

/settings/notifications Digest preferences

New/updated screens
Author Dashboard — /stats

Tables: Stories with metrics: Views, Reads, Read Ratio, Claps, Bookmarks, Responses; Date range (7/30/90/all).
Trends: Simple deltas; sparkline per metric.

Story Details — /stats/story/:id

Charts: Daily Views vs Reads; Engagement funnel; Top internal sources (feed, publication, profile, tag hub).
Notes: Version history label.

Publication Dashboard — /pub/:h/stats

Aggregate metrics; Top authors/stories.

Settings – Notifications — /settings/notifications

Digest cadence: Off/Daily/Weekly; Per-event toggles (follows, mentions, boosts, pub decisions, new stories from follows/tags).

R4 Flows
[Author Dashboard /stats]
  -> click story row -> [Story Details /stats/story/:id]
  -> view funnel & sources

[Settings/notifications]
  -> set "Weekly Digest: On"

[Weekly Digest email/app]
  -> entries: boosted + followed authors/tags/publications
  -> click -> [Story]

R5 — Highlights, Notes & Collections
New routes

/highlights My Highlights

/collections My Collections (list)

/collections/:collectionId Collection Detail

New/updated screens
Story (Reader) — updated

Select text → menu: Highlight | Add note | Copy link to paragraph

Highlights shown to the selector in-page; linkable anchors.

My Highlights — /highlights

List of highlighted passages grouped by Story; search in notes.

Collections

List /collections: shows owned collections + “New Collection”.

Detail /collections/:id: Title, description, list of stories; “Add stories” from story page; share internal link (view-only).

R5 Flows
[Story]
  -> select text -> "Highlight" -> (saved) 
  -> "Add note" -> (note saved)
  -> "Add to Collection" -> choose/create -> [Collections updated]

[Collections /collections] 
  -> open collection -> [/collections/:id] -> share link

R6 — Governance, Safety & Quality
New/changed routes

/report (modal from any Story/Response)

/admin/moderation Moderation Queue

/rules House Rules (static CMS page)

New/updated screens
Report Modal — (invoked on Story/Response)

Fields: Reason (confidential, harassment, spam, copyright, other), optional note.
Result: Case created in Moderation Queue.

Moderation Queue — /admin/moderation

Columns: New → Reviewing → Resolved
Actions: Hide content, Warn author, Require edits, Remove, Escalate.
Audit log: Who/when/action/reason.

House Rules — /rules

Editable by Admin; displayed in footer and publish checklist.

R6 Flows
[Story/Response]
  -> "Report" -> [Report Modal] -> submit -> [Admin Moderation Queue]

[Admin /admin/moderation]
  -> open case -> choose action -> [Audit logged] -> notify author

R7 — Publications v2: Templates, Checklists, Syndication
New/changed routes

/pub/:handle/templates (editor)

/pub/:handle/submission-checklist (editor)

/pub/:handle/syndication (editor)

Syndication action on Story/Pub Queue

New/updated screens
Submission Templates — /pub/:h/templates

Define required submission sections (e.g., Summary, Target Reader, Key Takeaways).

Submission Checklist — /pub/:h/submission-checklist

Define checkboxes (e.g., “Reviewed by legal”, “Approved by manager”).
Behavior: Writer must complete all before submission.

Syndication Panel — /pub/:h/syndication

Actions: Share accepted story to other publications (request/accept).
Display: “Also appears in …” on Story.

R7 Flows
[Editor /pub/:h/templates]
  -> add required fields
[Editor /pub/:h/submission-checklist]
  -> add items

[Writer /submit/:storyId]
  -> must fill template fields + check all items -> "Submit"

[Editor (origin pub)]
  -> Accept -> "Share to other pubs" -> select pub -> [Request sent]
[Editor (target pub)]
  -> Accept request -> [Story appears in both pubs]

R8 — Optional Monetization & Access Controls (if externalized)
New/changed routes

/settings/membership (user)

Paywall preview on Story

/earnings (author)

New/updated screens
Membership Settings — /settings/membership

Choose tier (Reader/Supporter/Org). Payment UX (functional placeholder).

Story (Reader) — paywalled

State: members-only: show preview + “Sign in / Become member” CTA.

Earnings — /earnings

Aggregate engagement time/reads → estimated earnings (if program on).

R8 Flows
[Author]
  -> Mark story "Members-only" -> [Story shows preview to non-members]

[Reader]
  -> open members-only -> [Preview + CTA] -> subscribe -> [Full access]

State Machines (concise, functional)
Story lifecycle

draft → published(v1) → published(v2+) (on republish) → unpublished (optional; returns to draft)

Transitions and guards:

Publish from editor requires title and at least 1 block of content.

Republish creates immutable version; surface “Updated on …”.

Unpublish hides from feeds, 404 for non-author, visible in author dashboard.

Publication submission lifecycle (R2+)

unsent → submitted → (in-review ↔ changes-requested) → accepted → scheduled → published

Editors can “Feature” anytime from accepted onward.

Moderation case (R6+)

new → reviewing → resolved:{hidden|removed|warned|edit-required|escalated} (audit logged)

Navigation Flowcharts per Release (compact view)
R0
[Home]
  ├─ Latest list → [Story]
  ├─ Tag chip → [Tag Hub]
  ├─ Search → [Search]
  └─ Write → [Draft Editor] → Publish → [Story]
[Story] ├─ Clap ├─ Bookmark → [Bookmarks] └─ Respond
[Profile] → [Story]

R1 (deltas)
[Draft Editor] ── Share for review → [Reviewers add comments] → Resolve → Publish
[Home] tabs: Latest | Following
[Story] responses: threaded; @mentions → [Notifications]
[Profile] Follow button → [Following feed]

R2 (deltas)
[Story] → Submit to Publication → [Pub Queue]
[Editor Queue] → Review → (Request changes | Accept & Schedule | Reject)
[Publication Home] → Featured | Latest

R3 (deltas)
[Home] tabs: For You | Latest | Following | By Tag
[Curator] Boost story → [For You prioritized] + Curated badge
[Topics] Subscribe → [For You tuned]

R4 (deltas)
[Author Dashboard] → [Story Details]
[Publication Dashboard]
[Settings/Notifications] → Digest prefs → Weekly Digest

R5 (deltas)
[Story] select text → (Highlight | Note | Copy link)
[My Highlights]
[Collections] list → detail (share)

R6 (deltas)
[Story/Response] → Report → [Admin Moderation Queue] → action → [Audit log]
[/rules] House Rules

R7 (deltas)
[Pub Templates] + [Pub Checklist]
[Submit] requires template fields + checks
[Origin Pub] → Syndicate → [Target Pub accepts] → “Also appears in …”

R8 (optional deltas)
[Story] mark Members-only → [Preview to non-members]
[Settings/Membership] → subscribe
[Earnings]

Why this design

Direct mapping to your functional spec: Each release only adds screens needed to unlock the next capability without refactors. Editor, Story, Profile, Feeds, and Publications evolve incrementally.

Stable routes from day one: /@handle/story/slug, /pub/:handle, and /write/:id never change, so links and analytics remain valid across releases.

Separation of concerns: Authoring (Editor), Consuming (Reader/Feeds), Organizing (Tags, Publications, Topics, Collections), and Governing (Moderation) live in clear surfaces.

Actionable for developers: Every screen lists entry points, states, and actions—enough to create tickets and wire basic controllers before visual design.

Progressive complexity: R0 is a usable loop (write→publish→read→respond). R1 improves quality (review). R2 adds team curation (publications). R3–R5 scale distribution and knowledge reuse. R6–R7 harden governance and production workflows. R8 stays optional.

If you want, I can turn this into a set of Jira-ready epics/stories next, or generate OpenAPI route stubs aligned to these screens (still functional only, no tech choices).

Você disse:
turn the specification and the screen definitions into two pdf files I can download.
O ChatGPT disse:

All set! Here are your two PDFs:

Download the Functional Specification

Download the Screens & Navigation Spec

If you want, I can also export these as DOCX/Markdown for easy editing, or split them into Jira-ready epics and stories.