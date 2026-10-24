# Textbook quality ledger

A chapter is complete only after every gate below has evidence. Word counts,
section counts and a successful deployment do not establish textbook completeness.

| Gate | Chapter 1 evidence / remaining work |
|---|---|
| Fundamentals, mechanisms, trade-offs, operations | 17 conceptual sections reviewed, including transaction boundaries, external effects, deadlines, percentiles, recovery and expanded checkout internals |
| Answered practice | 30 interview responses plus 30 answered follow-ups, 6 worked exercises plus 6 stretch answers, 10-part review kit |
| Executable code | Java payment-state example: six invariant checks pass; explicitly scoped as domain policy, not a production payment implementation |
| Diagrams | Responsive accessible payment-state SVG; text flow diagrams retained and visually checked in the complete print edition |
| Navigation | Local link targets, fragments and duplicate IDs checked across all four editions |
| Browser and mobile | 22 Chromium checks passed at 360/390/768/1440 px; evidence run 40096727368 |
| Modes and tooltips | Four editions expose Textbook/Cornell/Revision; bounded glossary, Escape dismissal, ambiguous auto-matches removed |
| Printing | All 12 PDFs generated; complete Textbook (40 pages), Cornell (45 pages) and Revision (2 pages) visually reviewed. Split code/tables and surplus revision page corrected; final cue-to-answer pagination adjustment visually verified |
| Edition consistency | Complete edition generated from canonical sources and checked in CI |
| Sources | Primary Spring and PostgreSQL references added beside adapter discussion |

**Chapter 1: quality gate passed for the foundations scope on 24 October 2026. Chapter 2: expanded draft; browser/print checks passed, deeper coverage still in progress.**
Chapters 3–20 have not been audited in this pass and must not be inferred complete.

## Reproduce

```sh
python3 scripts/build-chapter-one.py --check
python3 tests/chapter-structure.py
node --check v2/assets/book.js
java v2/examples/ch01/PaymentIntent.java
npm install --no-save @playwright/test@1.58.2
npx playwright install chromium
npx playwright test
```

CI artifacts contain viewport screenshots, PDFs in all three modes, and an HTML
report. Inspect pagination, table boundaries, code wrapping, diagram labels and
last-page completeness before marking print review passed. Regenerate the complete
edition after changing core, exercises or review-kit content.

## Sequential chapter queue

| Part | Title | Status in this pass |
|---|---|---|
| 01 | Architecture Foundations | Quality gate passed |
| 02 | Networking and HTTP | Expanded and validated; depth work remains |
| 03 | Scalability and Capacity | Waiting for previous chapter quality gate |
| 04 | API Architecture | Waiting for previous chapter quality gate |
| 05 | Java and JVM | Waiting for previous chapter quality gate |
| 06 | Spring Boot | Waiting for previous chapter quality gate |
| 07 | Relational Data | Waiting for previous chapter quality gate |
| 08 | NoSQL and Storage | Waiting for previous chapter quality gate |
| 09 | Caching | Waiting for previous chapter quality gate |
| 10 | Messaging and Event-Driven Systems | Waiting for previous chapter quality gate |
| 11 | Distributed Systems | Waiting for previous chapter quality gate |
| 12 | Reliability and Recovery | Waiting for previous chapter quality gate |
| 13 | Delivery and Deployment | Waiting for previous chapter quality gate |
| 14 | Containers and Kubernetes | Waiting for previous chapter quality gate |
| 15 | AWS Architecture | Waiting for previous chapter quality gate |
| 16 | Security and Identity | Waiting for previous chapter quality gate |
| 17 | Observability and Performance | Waiting for previous chapter quality gate |
| 18 | AI Systems | Waiting for previous chapter quality gate |
| 19 | Architecture Evolution | Waiting for previous chapter quality gate |
| 20 | End-to-End Case Studies | Waiting for previous chapter quality gate |

Evidence: https://github.com/jugesh/architectacademy/actions/runs/40096727368

Validation is Chromium/A4 only. The Java example verifies domain transitions, not a live database/provider integration. Full production correctness is not claimed.

## Chapter 2 evidence

Restored eight core teaching sections from misplaced cues/summary text; expanded connection setup, HTTP semantics, protocols, load balancing, timeout budgets, cache privacy and diagnostics. Added responsive cold/warm connection diagram, 12 answered interview follow-ups and a loopback Java timeout lab. Java lab passes locally. Six browser/print tests pass alongside all 22 Chapter 1 checks (28 total). Textbook and Cornell PDFs are 15 pages each; Revision is one page. All pages and the mobile diagram were visually reviewed, and PDF text remains within page bounds. This chapter is not marked complete.

Evidence: https://github.com/jugesh/architectacademy/actions/runs/40101424976

Remaining Chapter 2 depth gates: IP routing/CIDR and NAT resource exhaustion; DNS caching/failover internals; certificate lifecycle and rotation drill; a fuller AWS request-path case study and additional worked fault exercises. Complete these before Chapter 3.
