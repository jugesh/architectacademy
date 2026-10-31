# V4 architecture learning priorities

Updated 31 October 2026. No new labs.

| Priority | Delivered through the current depth round | Remaining review |
|---|---|---|
| 1 Teaching | Section-level explanations across all 17 core lessons, connected examples, checkpoints and topic-specific interview follow-ups | Further editorial refinement and selected-version implementation validation |
| 2 Decisions | Storage/communication/coordination selection, original inventory record and three fully evaluated decision records | More workload-specific evidence and alternatives |
| 3 Failures | Six fictional incidents with hypotheses, mitigation, repair and recovery proof | Additional incident domains and deeper operational evidence |
| 4 Capacity/cost | Workload, concurrency, storage, backlog and price-unit models plus cache/pool/rollout sensitivity review | Measurements from a real workload and current regional quotes |
| 5 Java/Spring | Pools, proxy transactions, virtual/reactive execution, memory/context and flush/commit diagnosis | More ORM/JVM examples against a selected stack |
| 6 Interviews | Tiered workbook, follow-ups, scoring rubric and three evaluated answers to one prompt | More complete mock prompts and assessed answers |
| 7 Migration | Schema, runtime, database and service migration guidance plus evidence-gated bounded-pause cutover | Product/version-specific recovery runbooks |
| 8 Revision | Searchable glossary, prerequisite/comparison maps, browser-local checklist and answered retrieval scenarios | Broader glossary and further transfer scenarios |

The current round has advanced every requested priority in order. It does not equate a teaching-depth pass with exhaustive textbook or production implementation completeness. All existing core lessons and V3 labels/order remain intact.


## Foundation explanation pass — 31 October 2026

- Networking: section-level explanations for destination/authority, measured deadlines, DNS/TCP/TLS/HTTP boundaries, pool waiting, stream concurrency, trust, diagnostics and safe retries. Added an evidence/unknowns table and two interview follow-ups.
- Security: section-level explanations for credential/protocol/policy distinctions, tenant/resource rules, token-validation sequence, browser and callback threats, permission freshness and key rotation. Added an authorization variation matrix and two interview follow-ups.
- API Design: expanded 27 existing sections after their definition/introduction, using the same order journey and explicit transitions into mechanisms and worked designs. Existing section IDs, definitions, examples and curriculum remain intact.
- No new topics or labs. Other lessons still need the same section-level treatment; the next pair is Scalability and Databases, followed by Caching and Messaging.


## Workload and storage explanation pass — 31 October 2026

- Scalability: section-level derivations for workload shape, targets/invariants, Little’s Law assumptions, waiting versus execution, scaling dimensions, fleet connection budgets, autoscaling delay and failure/rollout headroom. Added average-work and transition-evidence tables plus two interview follow-ups.
- Databases: section-level derivations for access patterns, business identity, model ownership, composite index access/plans, transaction properties, conditional mutations, storage model selection, replica freshness and projection backfill. Added a concurrent last-item timeline plus two interview follow-ups. Preserved the worked design’s existing verification checklist.
- Existing lesson IDs, navigation, definitions, structured examples and V3 curriculum remain intact. No new topics or labs.
- Next section-level pair: Caching and Messaging; then Consistency and Microservice Boundaries.


## Remaining lesson explanation pass — 31 October 2026

Completed the section-level pass through all remaining core lessons, in roadmap order:

| Group | Lessons | Section-level work |
|---|---|---|
| Copies and delivery | Caching; Messaging | Freshness and refill races; layered copies; bounded fallback; producer/consumer commit gaps; remote-effect reconciliation; replay and quarantine |
| Distributed decisions | Consistency; Microservice Boundaries; Rate Limiting; Replication/Partitioning | Observation versus atomicity; ownership and extraction; rate/quota/concurrency; quorum/fencing; key skew and migration |
| Operations | Reliability; Deployment/Runtime; Disaster Recovery; Observability | Deadlines/retry ownership; mixed versions and drain; restore/reconcile/failback; signal boundaries and durable evidence |
| Projections and practice | Search/Pipelines; End-to-End Design Practice | Baseline/CDC handoff; event versus processing time; source authority; scenario-by-scenario design reasoning |

Added 24 topic-specific interview follow-ups, a cache-race table and a five-window message recovery table. Existing routes, formal definitions, structured examples and V3 curriculum remain intact. No new topics or labs.

This completes an authored section-level teaching pass across all 17 V4 core lessons. It is not a claim that every implementation is exhaustive or production-ready. The next depth priority is to expand the decision guides and production cases with more fully evaluated alternatives, then estimation/runtime, interview, migration and revision material in the original priority order.


## Decision and production-case depth — 31 October 2026

Expanded the next priorities after the core lesson pass: three full decision records (cached view versus authoritative purchase, deferred receipt delivery, relational inventory authority), each with requirements, comparable alternatives, chosen boundaries, rejected shortcuts, evidence gates and revisit triggers. Added two fictional investigations (external payment after database restore; stale/cached authorization or previously issued capability after permission removal), bringing the case guide to six incidents. Added four answered follow-ups. Existing guide anchors and core curriculum remain intact.


The same guide-depth round also adds a capacity sensitivity review with explicit request/database/concurrency budgets, a Spring flush/commit diagnosis, three evaluated answers to one interview prompt, an evidence-gated write-pause cutover plan, and five answered retrieval scenarios. This advances every original priority in order after the core lesson pass; actual workload measurements, selected-version integration validation and further editorial depth remain ongoing concerns rather than claimed guarantees.
