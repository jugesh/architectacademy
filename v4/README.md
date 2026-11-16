# V4 architecture lessons

Entry points: `index.html` (existing API Design) and `lessons.html` (17-lesson library plus seven study guides).

Sixteen additional lessons: networking, security, scalability, databases, caching, messaging, consistency, microservice boundaries, rate limiting, replication/partitioning, reliability, deployment/runtime, disaster recovery, search/pipelines, observability and design practice. These are broad authored lessons, not a replacement or renaming of the exact 121-topic V3 curriculum.

Each new lesson has a formal definition, assumed knowledge, a running problem, functional/non-functional requirements, technical progression, implementation mapping, a worked design, failure analysis, six tiered interview answers, and annotated primary references. Code is explanatory rather than a compiled service.

Edit `lesson-content.mjs` and `lesson-expansion.mjs` for authored content; `learning-bridges.mjs` deepens the original six introductions and transitions. Rendering helpers live in `lesson-helpers.mjs`. Run `node v4/build-lessons.mjs` from the repository root to regenerate the sixteen standalone HTML pages and library. Each page embeds the API lesson's CSS plus shared navigation/print behavior; generated pages work without fetching JS or CSS assets. Keep generated pages committed because GitHub Pages serves this repository directly. The library orders lessons by a recommended prerequisite path; individual lessons link exact prerequisite sections.

The existing API lesson remains independently authored at its original URL. New lessons reuse its visual and pedagogical structure, not its 30-section topic count. For browser verification, check library/lesson links, mobile overflow and contents menu, interview disclosure controls, all print answers, and the existing API implementation tabs.


## Teaching and architecture practice expansion

`teaching-depth.mjs` adds an authored reasoning path, a stepwise explanation at a core mechanism, and two answered checkpoints to each of the sixteen generated lessons. API Design has a corresponding independently authored order walkthrough. This is an initial teaching-depth pass, not a claim that every existing section is now exhaustive.

`architecture-practice.mjs` contains seven companion guides, ordered after the existing lesson explanations: decision guides; fictional production failure case studies; capacity/cost estimation; Java/Spring internals; a tiered interview workbook; migration/modernization; and revision tools. The original 17-lesson learning path remains intact and the V3 reference curriculum is untouched. Generated guide HTML is committed alongside lesson HTML.

Revision uses the browser-local key `aa-v4-review-v1`. It reports unavailable storage, supports filtering with an empty-result count, and resets only its own marks. All 25 core lessons are included. These marks are self-reported recall, not exam scores or synced learning records. Printing shows all glossary entries, even with a filter active, and expands interview answers while preserving original disclosure state after repeated print events.

Numeric examples use explicit illustrative assumptions. AWS pricing is a unit model with a link to current quotes, not an assertion of current prices. Code fragments are explanatory; no runnable labs were added. Primary references should be checked against the actual deployed product/version before applying implementation details.


`foundation-explanations.mjs` provides section-level explanations and transitions for Networking and Security. It runs after the shared teaching-depth pass and replaces only a leading paragraph where appropriate, preserving the existing structured examples, tables, code and references. API Design's corresponding 27 section walkthroughs are authored directly in `index.html`, after each existing definition/introduction. Its original anchors and definitions are preserved.


`workload-storage-explanations.mjs` deepens Scalability and Databases after the shared teaching pass. It replaces leading narrative with authored derivations while keeping structured examples, tables, code, later caveats and references. The database worked-design verification paragraph is explicitly retained. Added tables separate measurement assumptions, transition evidence and concurrent mutation outcomes.


The remaining section-level explanation modules are `copies-delivery-explanations.mjs` (Caching/Messaging), `distributed-explanations.mjs` (Consistency/Boundaries/Rate Limiting/Replication), `operations-explanations.mjs` (Reliability/Deployment/DR/Observability), and `projections-design-explanations.mjs` (Search/Pipelines and Design Practice). They retain the core lesson identities and structured examples while replacing terse leading narrative with authored reasoning. Interview follow-ups are topic-specific. Together with the earlier foundation and workload/storage modules, all 17 core lessons have a section-level explanation pass; this is not an assertion of exhaustive implementation depth.


`decision-case-depth.mjs` expands the existing decision and failure guides with evaluated alternatives and two additional fictional investigations. It runs on `practiceGuides` before rendering, preserving the original guide/core routes. These are teaching records and fictional incidents, not production incident reports.


`guide-worked-depth.mjs` adds worked analysis to the remaining five practice guides: capacity sensitivity, Spring commit diagnosis, evaluated interview answers, cutover evidence gates and recall scenarios. Numbers are illustrative assumptions, and no runnable lab or current-price claim is introduced.


## Library navigation

`library-categories.mjs` is the source for seven core subject groups, three guide-purpose groups and the separate recommended first-read sequence. The build rejects omissions, duplicates or unknown pages. Category anchors are `category-*`; study-guide groups are `practice-*`, while the existing `#practice` entry point is retained. All lesson URLs remain unchanged. Every lesson/guide has a breadcrumb back to its library group, including independently authored API Design; the builder refreshes only its marked breadcrumb. The library’s subject order does not change the established previous/next reading path.

## Search and browser-local study state

`study-tools.js` and `study-tools.css` provide section search, explicit progress and resume for all 32 lesson/guide pages. `build-lessons.mjs` builds `search-index.json` from the final generated sections, including the independently authored API page. Search is case-insensitive and requires all query words within one section; title/heading matches rank first. Results link to the section and show a text excerpt. The index is loaded only when searching; failed loads can be retried by typing again. Serve over HTTP, as with GitHub Pages.

The `aa-v4-study-v1` localStorage record contains only allowlisted lesson slugs, three progress states and the last reading section. Opening an unmarked page starts it; an explicitly chosen Not started or Reviewed state is retained. Scroll position is stored as a section anchor, not pixel coordinates. Progress filters affect browsing, while print includes all cards. State is specific to this browser/origin, does not sync between devices and is lost if browser site data is cleared. When storage is unavailable, controls work for the current page and report the limitation. Existing `aa-v4-review-v1` explanation checklist marks remain independent.

`content-audit.mjs` holds the targeted improvements and related-reading links. See [CONTENT-AUDIT.md](CONTENT-AUDIT.md) for the reviewed gaps and the limits of that audit. Generated content and index must remain reproducible with `node v4/build-lessons.mjs`.

## Core worked depth

`depth/index.mjs` inserts four dedicated sections into each of eight core lessons: Databases, Messaging, Reliability, Observability, Caching, Consistency, Replication & Partitioning, and Security. The per-lesson modules own original worked protocols, code outlines, concurrency/failure schedules, calculations, answered questions and primary references. Insertion validates target anchors and rejects duplicate IDs; the generator automatically updates both page maps and the search index. Existing section URLs remain stable. Browser coverage checks the new deep links, narrow-screen code/layout, expanded print answers and full-section search.

## Public home page

The build generates the root `index.html` as the categorized library itself, without a redirect or base-URL override. Static lesson/asset links are rooted beneath `v4/`; category fragments remain on the home page. A `data-lesson-prefix` lets the shared search and resume code resolve the same lesson URLs from either home or `v4/lessons.html`, using the same saved study state. Current home/library/API/lesson navigation has no links back to V2 or V3. CI checks reproducibility for the root index as well as V4 output.

`messaging-guide.mjs` applies the final teaching pass for Messaging after the existing depth modules: a beginner-friendly O7/E91 narrative, term-first explanations, a two-pass reading route, four new guided sections and plain-language bridges before advanced SQL/recovery. Existing section IDs and advanced protocols remain available; generated navigation and search include the new material.

## BDD and TDD lessons

`testing-lessons.mjs` adds two dedicated lessons after the older content passes. They share an order-cancellation story, with separate discovery/acceptance and red–green–refactor explanations. The Testing & Quality group contains both; the library now has 19 core lessons and seven guides. Counts in the library description come from the content collections.

The Java 17+/JUnit 5.13.1 examples in `examples/testing` are embedded from source by the builder. Run `mvn -B -f v4/examples/testing/pom.xml test`; CI executes the policy, acceptance and generated-property checks. The acceptance fixture is deliberately in-memory and covers domain behavior only. Cucumber adapter code is illustrative; HTTP, authorization, database commits, concurrency and delivery semantics require the additional boundary checks described in the lessons.

## Mobile navigation

`study-tools.js` enhances each current root/V4 header with a hamburger disclosure at widths up to 700px. It reuses existing site links and sidebar section/category links, exposes expanded state, closes on Escape (returning focus), link selection, outside click, focus leaving the header, desktop resize and printing. The scrollable panel preserves reading space and uses 44px touch targets. Desktop navigation and the original no-JavaScript fallback remain available. Shared CSS keeps the menu out of printed pages.

## Additional development approaches

`development-approaches.mjs` adds six dedicated lessons: ATDD, DDD, contract-first development, consumer-driven contract testing, property-based testing and mutation testing. They are appended after the older teaching passes, with topic-specific examples, diagrams, six answered questions each, scope limits and primary references. The current library has 25 core lessons and seven study guides. DDD/contract-first sit in Design Practice; the other four join BDD/TDD in Testing & Quality.

`examples/testing` now contains Inventory, its acceptance examples and two QuickTheories 0.26 properties (1,000 sampled cases each, fixed seeds). The Maven configuration pins PIT 1.18.2 / JUnit plugin 1.2.2 and scopes mutation analysis to Inventory plus InventoryExamplesTest. CI runs ordinary tests and mutation analysis and retains the report; no universal mutation-score threshold is claimed. Both lessons embed the actual Java sources.

`examples/contracts/cancellation.openapi.json` is an illustrative OpenAPI 3.1.1 document. It is a contract artifact, not a running endpoint. The consumer-contract lesson explains Pact-style interaction/provider/deployment evidence without claiming a bundled Pact Broker or verified live provider. Browser coverage includes every new page and search/discovery.
