# V4 architecture learning priorities

Updated 31 October 2026. No new labs.

| Priority | Delivered in this update | Remaining depth |
|---|---|---|
| 1 Teaching | Authored reasoning paths for all 17 lessons; 32 answered checkpoints and 16 mechanism derivations in generated lessons; API order walkthrough | Review and expand individual advanced sections over subsequent revisions; this is not an exhaustive rewrite |
| 2 Decisions | Storage, communication and coordination selection plus a complete decision record | More workload-specific alternatives |
| 3 Failures | Four fictional incidents with hypotheses, mitigation, repair and recovery proof | More cross-region and security incidents |
| 4 Capacity/cost | Workload, concurrency, headroom, storage, cache, queue and price-unit examples | Measurements from a real workload; current region-specific quotes |
| 5 Java/Spring | Pools, proxy transactions, virtual/reactive execution, memory/context and a diagnosis | More ORM and JVM worked examples |
| 6 Interviews | 14 tiered answers with follow-ups and a scoring rubric in the workbook | More full mock prompts and evaluated candidate answers |
| 7 Migration | Schema, Java/Spring, database, service extraction and cross-account cutover | Product/version-specific runbooks |
| 8 Revision | 18-term searchable glossary, prerequisite map, comparisons and local recall checklist | Broader glossary and additional recall scenarios |

The first pass establishes usable material at every requested priority, in order. It does not equate initial coverage with textbook completeness. All existing core lessons and V3 labels/order remain intact.


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
