# Architect Academy V3

Open `/v3/` through any static HTTP server. No build step or external JavaScript dependency is required.

V3 is a focused notes reader with 25 original lessons in seven topic groups. Idempotency is the first expanded guided lesson; the remaining lessons are explicitly labeled concise notes. This is not a claim that the full reference curriculum or V2 textbook has been rewritten.

## Reading and study

- Nested curriculum, live search, saved-lesson filter, completion tracking and previous/next navigation.
- Notes, Cornell recall prompts and revision modes; print styling and expanded answers for printing.
- Personal notes, bookmarks, reading mode and completion persist in localStorage on this browser and origin. No cloud sync. Clearing site data removes them. Storage failure falls back to session memory.
- Responsive mobile curriculum drawer, keyboard focus, reduced-motion support and semantic SVG diagrams.
- Idempotency simulation compares three deterministic retry strategies. It does not execute payments.

## Editing

`lessons.js` owns the original notes and curriculum. Every lesson ID must appear once in the curriculum and lesson array. `app.js` renders the reader and the detailed idempotency lesson; `styles.css` contains screen and print styles. Route fragments identify lessons. Primary references are included for the guided lesson and retry notes; V2 links provide deeper existing textbook coverage.

Run `npx playwright test tests/v3-browser.spec.js` after installing Playwright Chromium. Checks cover all routes, V2 links, persistence, saved filtering, mobile navigation, retry effects, revision mode, print output and denied storage.

The reference site's information architecture inspired the nested navigation and study flow. Lesson prose, application code and diagrams are original. Existing V1/V2 entry points remain available.
