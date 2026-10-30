# V4 architecture lessons

Entry points: `index.html` (existing API Design) and `lessons.html` (seven-lesson library).

Sixteen additional lessons: networking, security, scalability, databases, caching, messaging, consistency, microservice boundaries, rate limiting, replication/partitioning, reliability, deployment/runtime, disaster recovery, search/pipelines, observability and design practice. These are broad authored lessons, not a replacement or renaming of the exact 121-topic V3 curriculum.

Each new lesson has a formal definition, assumed knowledge, a running problem, functional/non-functional requirements, technical progression, implementation mapping, a worked design, failure analysis, six tiered interview answers, and annotated primary references. Code is explanatory rather than a compiled service.

Edit `lesson-content.mjs` and `lesson-expansion.mjs` for authored content; `learning-bridges.mjs` deepens the original six introductions and transitions. Rendering helpers live in `lesson-helpers.mjs`. Run `node v4/build-lessons.mjs` from the repository root to regenerate the sixteen standalone HTML pages and library. Each page embeds the API lesson's CSS plus shared navigation/print behavior; generated pages work without fetching JS or CSS assets. Keep generated pages committed because GitHub Pages serves this repository directly. The library orders lessons by a recommended prerequisite path; individual lessons link exact prerequisite sections.

The existing API lesson remains independently authored at its original URL. New lessons reuse its visual and pedagogical structure, not its 30-section topic count. For browser verification, check library/lesson links, mobile overflow and contents menu, interview disclosure controls, all print answers, and the existing API implementation tabs.
