# Architect Academy

[V3 system design notes](https://jugesh.github.io/architectacademy/v3/) — the exact 7-section, 23-subsection, 121-topic System Design School navigation, with original notes, personal study tools and a guided idempotency walkthrough. [V3 details](v3/README.md).

**A free, interactive architecture textbook and practice environment.**

[Open the textbook](https://jugesh.github.io/architectacademy/) · [All 120 lessons](https://jugesh.github.io/architectacademy/lesson-index.html) · [12 engineering labs](https://jugesh.github.io/architectacademy/labs.html) · [36 architecture challenges](https://jugesh.github.io/architectacademy/challenges.html)

Architect Academy is a browser-based collection of lessons on software architecture, distributed systems, Java and Spring, Kafka, MongoDB, AWS, Kubernetes, security, reliability, performance and operational decision-making. Lessons include explanations, diagrams, practice prompts and production incident scenarios.

## Who it's for

Backend engineers, technical leads, solution architects and architecture interview candidates who need to **explain mechanisms, defend trade-offs, and reason about failures**.

## Features

- **120 lessons** across a guided syllabus, each directly linkable (example: [Spring Boot lifecycle and transactions](https://jugesh.github.io/architectacademy/#lesson-47)).
- **Interactive flow diagrams** with normal/failure modes on selected lessons.
- **12 engineering labs** for experimenting with simplified workload, consistency and recovery models.
- **36 architecture design challenges** with progressive hints, reference approaches and self-review.
- Local lesson notes, separate bookmarks and completion tracking, and JSON backup/export.
- Static [lesson directory](https://jugesh.github.io/architectacademy/lesson-index.html) for browsing without JavaScript.

## Run locally

Clone the repository and open `index.html` in your browser:

```bash
git clone https://github.com/jugesh/architectacademy.git
cd architectacademy
python3 -m http.server 8000
```

Then visit http://localhost:8000. The pages are self-contained HTML/CSS/JavaScript; no build step, authentication or API keys are required. The labs and challenge pages can also be opened directly.

## Project structure

- `index.html` — interactive textbook, diagrams, notes and navigation.
- `labs.html` — numerical engineering simulations with stated assumptions.
- `challenges.html` — design challenges with local answers.
- `lesson-index.html` — HTML-visible lesson directory and static summaries.
- `sitemap.xml` — sitemap of crawlable HTML entry points.

## Sharing and data

Share a specific lesson with a stable hash route, for example `https://jugesh.github.io/architectacademy/#lesson-47`. Notes, bookmarks and completions are held **in your browser's localStorage**, so they do not automatically synchronize across devices. Export backups regularly. Lab models are learning approximations rather than measured infrastructure behavior.

Search engines can crawl the static lesson directory. The interactive textbook is JavaScript-rendered; the hash lesson views are **not individually server-rendered HTML pages**. Separate prerendered lesson URLs would be a future SEO improvement.

## Contributing

Suggestions, corrections, missing trade-offs and implementation examples are welcome through GitHub Issues and Pull Requests. For a substantive content change, please include:

1. The business problem or invariant being addressed.
2. Accurate mechanism, assumptions and constraints.
3. At least one non-obvious failure mode and rejected alternative.
4. A reproducible test or observable signal that validates the claim.

Do not include secrets, proprietary source code or private incident data.

## Author

Created and maintained by **[Jugesh](https://github.com/jugesh)**.

## License

Educational text, explanations, diagrams and original challenge content are licensed under **[Creative Commons Attribution 4.0 International](LICENSE)** (CC BY 4.0), unless separately attributed. The HTML/CSS/JavaScript software source is licensed under **[MIT](LICENSE-CODE)**. Third-party names and trademarks belong to their respective owners.

