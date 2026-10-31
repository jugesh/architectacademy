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
