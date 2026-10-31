# V4 architecture lessons

Entry points: `index.html` (existing API Design) and `lessons.html` (17-lesson library plus seven study guides).

Sixteen additional lessons: networking, security, scalability, databases, caching, messaging, consistency, microservice boundaries, rate limiting, replication/partitioning, reliability, deployment/runtime, disaster recovery, search/pipelines, observability and design practice. These are broad authored lessons, not a replacement or renaming of the exact 121-topic V3 curriculum.

Each new lesson has a formal definition, assumed knowledge, a running problem, functional/non-functional requirements, technical progression, implementation mapping, a worked design, failure analysis, six tiered interview answers, and annotated primary references. Code is explanatory rather than a compiled service.

Edit `lesson-content.mjs` and `lesson-expansion.mjs` for authored content; `learning-bridges.mjs` deepens the original six introductions and transitions. Rendering helpers live in `lesson-helpers.mjs`. Run `node v4/build-lessons.mjs` from the repository root to regenerate the sixteen standalone HTML pages and library. Each page embeds the API lesson's CSS plus shared navigation/print behavior; generated pages work without fetching JS or CSS assets. Keep generated pages committed because GitHub Pages serves this repository directly. The library orders lessons by a recommended prerequisite path; individual lessons link exact prerequisite sections.

The existing API lesson remains independently authored at its original URL. New lessons reuse its visual and pedagogical structure, not its 30-section topic count. For browser verification, check library/lesson links, mobile overflow and contents menu, interview disclosure controls, all print answers, and the existing API implementation tabs.


## Teaching and architecture practice expansion

`teaching-depth.mjs` adds an authored reasoning path, a stepwise explanation at a core mechanism, and two answered checkpoints to each of the sixteen generated lessons. API Design has a corresponding independently authored order walkthrough. This is an initial teaching-depth pass, not a claim that every existing section is now exhaustive.

`architecture-practice.mjs` contains seven companion guides, ordered after the existing lesson explanations: decision guides; fictional production failure case studies; capacity/cost estimation; Java/Spring internals; a tiered interview workbook; migration/modernization; and revision tools. The original 17-lesson learning path remains intact and the V3 reference curriculum is untouched. Generated guide HTML is committed alongside lesson HTML.

Revision uses the browser-local key `aa-v4-review-v1`. It reports unavailable storage, supports filtering with an empty-result count, and resets only its own marks. All 17 core lessons are included. These marks are self-reported recall, not exam scores or synced learning records. Printing shows all glossary entries, even with a filter active, and expands interview answers while preserving original disclosure state after repeated print events.

Numeric examples use explicit illustrative assumptions. AWS pricing is a unit model with a link to current quotes, not an assertion of current prices. Code fragments are explanatory; no runnable labs were added. Primary references should be checked against the actual deployed product/version before applying implementation details.


`foundation-explanations.mjs` provides section-level explanations and transitions for Networking and Security. It runs after the shared teaching-depth pass and replaces only a leading paragraph where appropriate, preserving the existing structured examples, tables, code and references. API Design's corresponding 27 section walkthroughs are authored directly in `index.html`, after each existing definition/introduction. Its original anchors and definitions are preserved.


`workload-storage-explanations.mjs` deepens Scalability and Databases after the shared teaching pass. It replaces leading narrative with authored derivations while keeping structured examples, tables, code, later caveats and references. The database worked-design verification paragraph is explicitly retained. Added tables separate measurement assumptions, transition evidence and concurrent mutation outcomes.


The remaining section-level explanation modules are `copies-delivery-explanations.mjs` (Caching/Messaging), `distributed-explanations.mjs` (Consistency/Boundaries/Rate Limiting/Replication), `operations-explanations.mjs` (Reliability/Deployment/DR/Observability), and `projections-design-explanations.mjs` (Search/Pipelines and Design Practice). They retain the core lesson identities and structured examples while replacing terse leading narrative with authored reasoning. Interview follow-ups are topic-specific. Together with the earlier foundation and workload/storage modules, all 17 core lessons have a section-level explanation pass; this is not an assertion of exhaustive implementation depth.


`decision-case-depth.mjs` expands the existing decision and failure guides with evaluated alternatives and two additional fictional investigations. It runs on `practiceGuides` before rendering, preserving the original guide/core routes. These are teaching records and fictional incidents, not production incident reports.


`guide-worked-depth.mjs` adds worked analysis to the remaining five practice guides: capacity sensitivity, Spring commit diagnosis, evaluated interview answers, cutover evidence gates and recall scenarios. Numbers are illustrative assumptions, and no runnable lab or current-price claim is introduced.


## Library navigation

`library-categories.mjs` is the source for six core subject groups, three guide-purpose groups and the separate recommended first-read sequence. The build rejects omissions, duplicates or unknown pages. Category anchors are `category-*`; study-guide groups are `practice-*`, while the existing `#practice` entry point is retained. All lesson URLs remain unchanged. Every lesson/guide has a breadcrumb back to its library group, including independently authored API Design; the builder refreshes only its marked breadcrumb. The library’s subject order does not change the established previous/next reading path.
