# Architect Academy V3

Open `/v3/` through any static HTTP server. No build step or external JavaScript dependency is required.

V3 follows the public System Design School navigation exactly: **7 sections, 23 subsections and 121 topics**, with the same topic labels, hierarchy and order captured on 2026-10-28. No topic is silently omitted, merged, renamed or added. The layout and original notes belong to Architect Academy; the reference lesson bodies are not copied.

All 121 topics have original content. Depth is visible on each page: 99 topic briefs, 21 longer concise notes and one guided idempotency lesson. A topic brief is not represented as a full course chapter or executed lab. Exercise topics contain original practice instructions; they do not claim the reference provider's labs were reproduced or run.

## Reading and study

- Nested curriculum, live search, saved-lesson filter, completion tracking and previous/next navigation.
- Notes, Cornell recall prompts and revision modes; print styling and expanded answers for printing.
- Personal notes, bookmarks, reading mode and completion persist in localStorage on this browser and origin. No cloud sync. Clearing site data removes them. Storage failure falls back to session memory.
- Responsive mobile curriculum drawer, keyboard focus, reduced-motion support and semantic SVG diagrams.
- Idempotency simulation compares three deterministic retry strategies. It does not execute payments.

## Editing

`curriculum.json` is the captured reference navigation contract, including its source URL and capture date. `curriculum.js` provides that same hierarchy to the browser. `lessons.js` holds expanded original notes, `topic-notes.js` holds original topic briefs, and `curriculum-adapter.js` maps content into the reference order. It throws for missing content instead of hiding topics or creating generic placeholders. Titles always come from the reference navigation.

`app.js` renders the reader and detailed idempotency lesson; `styles.css` contains screen and print styles. Route fragments use the reference topic IDs. Earlier V3 bookmarks, saved state and personal notes migrate to corresponding canonical routes. Primary references accompany the guided lesson and retry notes; V2 links provide deeper existing textbook coverage.

Run `node scripts/check-v3-curriculum.js` to check every section, subsection, topic, label and position against the captured reference. Run `npx playwright test tests/v3-browser.spec.js` after installing Playwright Chromium. Browser checks compare the rendered hierarchy to the reference and visit all 121 routes; they also cover V2 links, persistence, saved filtering, mobile navigation, retry effects, revision mode, print output, denied storage and legacy routes.

Reference navigation: https://systemdesignschool.io/fundamentals/what-is-system-design-interview . Any future curriculum change must be checked against a fresh capture of that navigation; do not substitute an inferred or abridged syllabus. Existing V1/V2 entry points remain available.
