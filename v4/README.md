# V4 architecture lessons

Entry points: `index.html` (existing API Design) and `lessons.html` (seven-lesson library).

Six additional lessons: scalability, databases, caching, messaging, reliability, observability. These are broad authored lessons, not a replacement or renaming of the exact 121-topic V3 curriculum.

Each new lesson has a formal definition, assumed knowledge, a running problem, functional/non-functional requirements, technical progression, implementation mapping, a worked design, failure analysis, six tiered interview answers, and annotated primary references. Code is explanatory rather than a compiled service.

Edit `lesson-content.mjs` for authored lesson content. Run `node v4/build-lessons.mjs` from the repository root to regenerate the six standalone HTML pages and library. Each page embeds the API lesson's CSS plus shared navigation/print behavior; generated pages work without fetching JS or CSS assets. Keep generated pages committed because GitHub Pages serves this repository directly.

The existing API lesson remains independently authored at its original URL. New lessons reuse its visual and pedagogical structure, not its 30-section topic count. For browser verification, check library/lesson links, mobile overflow and contents menu, interview disclosure controls, all print answers, and the existing API implementation tabs.
