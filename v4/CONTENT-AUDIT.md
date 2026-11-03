# V4 content audit — 1 November 2026

Reviewed the generated 17 core lessons and seven guides for section depth, worked failure arguments and navigation between concepts. Used section word counts only to identify candidates; short introductions, references and questions are not defects by themselves. Preserved the V3 7-section / 23-subsection / 121-topic curriculum.

| Selected gap | Improvement | Reader validation |
| --- | --- | --- |
| Design practice: booking | Conditional seat ownership, retry identity, hold expiry versus late payment, repeat-safe recovery | Inject expiry, resale and a duplicated late callback; preserve seat and financial invariants |
| Design practice: file uploads | Staged lifecycle, scoped upload identity, verification, finalize races and orphan cleanup | Reject premature completion and prevent cleanup from deleting committed objects |
| Design practice: chat | Durable acceptance versus push/read receipts, conversation ordering and reconnect catch-up | Lose response, reorder delivery, remove membership and cross retention boundaries |
| Design practice: URL shortening | Code-space calculation, enforced uniqueness, redirect revocation and analytics trade-offs | Demonstrate collision recovery and a defensible stale-redirect bound |
| Observability implementation | Context propagation across messaging, separate business identity, cardinality and sampling | Correlate a delayed consumer and a later retry without depending on a single retained trace |
| Rate-limit implementation | Serialized token debit, unavailable-store policy and global versus per-pod limits | Test concurrent replicas, scale-out, authorization-derived keys and dependency failure |
| Replication worked case | Read-your-writes under lag, fencing on promotion and acknowledged-loss limits | Resume the old writer and test freshness under injected lag |
| Pipeline event time | Watermark limits, allowed lateness, correction policies, stale replay and tombstones | Reorder/update/delete events and compare a rebuilt projection to authoritative facts |

Each of the 24 pages now has two purpose-specific related-reading links, validated against actual local anchors. Section search indexes the resulting teaching text and examples, including API Design.

This is a targeted improvement pass, not a claim that every section is a complete standalone chapter. Examples remain conceptual teaching designs; production implementations still require workload-specific measurements and the actual storage/provider/runtime contracts. No new labs or learning paths were introduced in this pass.

## Core lesson depth pass — 1 November 2026

Added 16 dedicated worked sections across Databases, Messaging, Reliability and Observability. Existing sections and anchors remain intact; each new section is in the desktop/mobile map and section-search index.

| Lesson | Added teaching material |
| --- | --- |
| Databases | Tenant-scoped SQL reservation/idempotency protocol; query-plan and keyset-pagination diagnosis; lost-update/write-skew schedules and recovery; Spring commit/propagation failure matrix |
| Messaging | Leased outbox relay with duplicate windows; transactional consumer receipt/effect protocol; contiguous offset frontier and ownership changes; backlog drain arithmetic and replay policy |
| Reliability | One deadline budget across waits; explicit retry/breaker/bulkhead composition; unknown-payment state machine with expiry races; business/resource fault-drill evidence |
| Observability | API/outbox/Kafka/database evidence journey; scoped Java propagation examples; matured-cohort completion SLO calculation; stranded-order investigation and recovery worksheet |

Examples distinguish illustrative settings, conceptual application methods and actual library APIs. SQL is PostgreSQL-specific; Java orchestration excerpts are teaching outlines rather than a packaged runnable application. Checked technical claims against the primary PostgreSQL, Spring, Kafka, SQS, JDK, Resilience4j and OpenTelemetry references linked beside the material. This pass does not claim that the remaining 13 core lessons have received the same new depth.

## Next core depth pass — 1 November 2026

Added another 16 worked sections, preserving existing section anchors and all study tools.

| Lesson | Added teaching material |
| --- | --- |
| Caching | Delayed-fill invalidation race; bounded refresh leases and atomic release; tenant/variant/negative-cache identity; cold-path capacity and outage admission |
| Consistency | Read/session histories; limits of quorum arithmetic; durable saga decisions and atomic next-command intent; conditional compensation and reconciliation |
| Replication & Partitioning | Acknowledgement/apply/failover evidence; resource-enforced fencing; hot-tenant capacity/fan-out calculation; gated shard transfer and rollback boundaries |
| Security | Resource-level transition authorization; tenant identity through workers/caches/exports; JWT/credential rotation lifecycle; raw-byte HMAC verification and durable callback replay handling |

The eight core lessons expanded across these two passes now contain 32 dedicated worked sections. Nine other core lessons have not yet received this same four-section depth treatment. Source-specific claims in this pass link to primary Redis, PostgreSQL, Spring Security, AWS, OWASP and JDK references. The callback helper demonstrates an explicitly illustrative HMAC protocol, not a provider-specific integration; CI compiles the displayed Java and tests a separately generated known tag plus rejection cases. SQL/application protocols remain teaching outlines with explicit authority/freshness assumptions, not claimed production-ready implementations.

## Messaging teaching progression — 2 November 2026

Reworked the opening around Alice's paid order O7 and stable event E91. Explain producer/broker/consumer, delivery versus completion, commands versus events and acknowledgements before introducing outbox/inbox protocols. Replace compressed/repeated explanations in the core reader-model, acknowledgement, outbox and pitfalls sections with a five-step walkthrough, failure tables and a two-pass reading route. Preserve existing anchors and advanced relay/consumer/offset/backlog sections, adding plain-language bridges before them.

Four new guided sections cover vocabulary/message identity, queue versus independent log readers, version-compatible events/rebuilds, and classified retry/quarantine/replay decisions. New browser coverage checks progression order, indexed anchors, mobile navigation, answers and print diagrams. Broker-specific claims retain linked primary Kafka/SQS references; application snippets are explicitly conceptual outlines.

## 2 November 2026 — BDD / TDD

Added dedicated BDD and TDD lessons with a shared cancellation story, vocabulary, examples, diagrams, failure boundaries, six answered questions each and primary references. BDD covers discovery, example mapping, Gherkin, adapter scope, asynchronous outcomes and specification maintenance. TDD covers an explicit red/green progression, the final policy, doubles, Spring/database test boundaries, deterministic time/races, legacy adoption and CI. Seven executable JUnit examples validate the final policy and in-memory acceptance flow; they do not claim HTTP, persistence or concurrency coverage. Both lessons are categorized, indexed, included in progress/revision, and covered by the existing navigation/mobile/print tests plus a discovery/search check.

## 3 November 2026 — six development approaches

Added ATDD, DDD, contract-first development, consumer-driven contract testing, property-based testing and mutation testing. Each has ten authored sections, six answered questions, a worked example, failure/verification limits and primary references. Integration includes both categorized libraries, reading sequence, breadcrumbs, search, progress, revision and the shared mobile menu.

Executable evidence: Inventory acceptance checks plus two bounded fixed-seed QuickTheories properties, and a scoped PIT analysis retained by CI. OpenAPI is a downloadable teaching artifact; Pact interactions are explicitly conceptual and not a claim of a running provider/Broker. These lessons do not claim that in-memory checks prove database concurrency, ownership, remote delivery or complete production correctness.
