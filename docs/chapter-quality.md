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

**Chapter 1: quality gate passed for the foundations scope on 24 October 2026. Chapter 2: networking foundations quality gate passed on 24 October 2026.**
Chapters 6–20 have not been audited in this pass and must not be inferred complete.

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
| 02 | Networking and HTTP | Quality gate passed |
| 03 | Scalability and Capacity | Quality gate passed |
| 04 | API Architecture | Quality gate passed |
| 05 | Java and JVM | Quality gate passed |
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

Chapter 2 completion pass (PR #17): added longest-prefix routing/CIDR, security group/ACL and NAT boundaries, egress exhaustion and MTU diagnosis; positive/negative DNS caching and cutover clocks; certificate trust overlap/rotation and fresh-handshake drill; a worked AWS checkout request path with responsive SVG, failure recovery and four answered fault exercises. Navigation and shared terminology updated. Six local networking browser tests pass at 360/390/768/1440 px using Chromium 153. The 22 Chapter 1 regression tests passed in the same local pass. All 22 Textbook and 24 Cornell PDF pages were visually reviewed; a surplus Revision notes page was removed and its final one-page output rechecked. Structural checks and the Java timeout lab pass. CI also runs its pinned Chromium version; local evidence is not a live AWS deployment claim.

Primary references are linked beside the relevant mechanisms. AWS examples are illustrative and the certificate/network drills require a controlled environment. Remaining book-wide verification includes additional browser engines.

## Chapter 3 evidence

Expanded capacity engineering from a specimen to resource-demand and queueing models, serial/partition limits, hot-key failure analysis, admission/fairness, delayed autoscaling, connection surge budgeting and a checkout acceptance case. Replaced repeated short sections with six substantial teaching units. All 12 interview follow-up exercises have worked answers. The deterministic Java AdmissionLab verifies active-work bounds, rejection before effect, and permit recovery on success/failure; it does not claim distributed quota enforcement.

The integrated edition is generated from canonical core, lab and interview pages; CI checks parity. All four editions support Textbook/Cornell/Revision. Twenty-one chapter browser checks pass across four widths in local Chromium 153. All 19 integrated Textbook, 20 Cornell and one Revision PDF pages were visually reviewed, plus the mobile SVG. All local links, fragments and duplicate IDs pass. Sources for HPA and AWS queue scaling are linked beside their mechanisms. The scope is capacity foundations and a local concurrency lab; load targets and AWS topology are explicitly illustrative, not measured production claims.

## Chapter 4 evidence

Expanded API contracts beyond idempotency: resource/protocol boundaries, validation and object authorization, problem details, PostgreSQL conflict/snapshot behavior, local transaction branches, remote recovery and fencing limits, pagination/snapshots, compatibility and async completion/cancellation. Added worked fault exercises, a responsive recovery-state SVG and worked answers to all 12 interview follow-ups. The local Java policy lab passes concurrent duplicate, conflict, tenant separation, equal-value distinct intents and stable replay checks. It intentionally does not verify SQL persistence or provider integration; SQL shown is explicitly conditional design pseudocode, with required database/session tests documented.

All four editions expose Textbook/Cornell/Revision and the integrated reader is generated with CI parity checks. Twenty-one local Chromium 153 browser checks pass across four widths. Integrated PDFs: 19 Textbook, 20 Cornell, one Revision page. All pages visually reviewed across the initial and final pagination pass; a one-line interview spill was corrected by keeping short interview units together. Mobile layout, local links/fragments and Java checks pass. RFC 9457, Spring MVC and PostgreSQL references are linked beside mechanisms. Scope: API architecture foundations and local policy correctness, not a production payment implementation.

## Chapter 5 evidence

Expanded JVM runtime/JIT/classloader lifecycles, allocation versus retention, charged-container/native memory accounting, GC mechanisms/experiments, publication and multi-field invariants, virtual-thread version boundaries, cancellation, context and executor failure analysis. Added worked diagnosis, responsive diagnostic SVG, all 12 worked interview follow-ups and a Java publication lab. The lab checks coherent immutable snapshots and exact atomic counts; its stress run is explicitly not a proof of arbitrary data-race safety.

Twenty-one chapter browser checks pass at four widths in local Chromium 153; all four reader editions expose three modes and generated complete-reader parity is enforced. All integrated 19 Textbook, 20 Cornell and one Revision PDF pages visually reviewed, with local links/fragments and Java checks passing. JDK 21 versus JDK 24 monitor pinning is distinguished using JEP 444/491; Oracle GC/NMT and JLS references are linked. Scope: Java/JVM architecture foundations and local publication policy, not a collector performance claim or production diagnostic execution.
