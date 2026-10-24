# Database concurrency and query-plan lab

## Index design for a real access pattern
Suppose a multi-tenant orders table contains 50 million rows and the API queries the newest PAID orders by tenant:

```sql
SELECT id, created_at, total
FROM orders
WHERE tenant_id = :tenant AND status = 'PAID'
  AND (created_at, id) < (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 50;
```
A candidate index is (tenant_id, status, created_at DESC, id DESC). Equality predicates precede the ordered range in this workload. Whether this is the *best* index depends on tenant cardinality, write overhead, columns returned, selectivity and database engine. Validate with EXPLAIN ANALYZE and real distributions, not synthetic tiny tables. The first page needs special handling instead of a null tuple comparison.

## Keyset pagination versus OFFSET
OFFSET 100000 LIMIT 50 may require traversing and discarding many rows; keyset pagination starts after a known ordered tuple. Use a deterministic tie-breaker ID. Keyset pagination navigates relative to the prior page; it does not automatically promise a snapshot across separate requests. Concurrent inserts/deletes can change the result set, so define user-facing pagination semantics.

## Atomic stock decrement
```sql
UPDATE inventory
SET available = available - 1
WHERE sku = :sku AND available > 0;
```
Require exactly one updated row to claim success. For a retryable reservation API, also persist a unique reservation ID so a repeated request cannot decrement again. A transaction around SELECT followed by UPDATE without appropriate locking can lose updates or violate invariants.

## Write skew timeline
```text
Constraint: at least one doctor must be on call.
T1 snapshot: A=on, B=on      T2 snapshot: A=on, B=on
T1 sets A=off                 T2 sets B=off
T1 commits                    T2 commits
Combined result: A=off, B=off -> invariant violated
```
This can occur under snapshot isolation in systems that allow write skew. Lock a shared invariant guard, enforce an appropriate constraint, or use suitable serializable isolation and retry serialization failures. Isolation behavior varies by engine; name the engine when discussing guarantees.

## Replicas, failover and backups
Asynchronous replication may return an older value after a primary acknowledges the write. A read-your-writes contract can route the follow-up read to primary or use a supported session/commit-position mechanism. Replicas are not backups: mistaken deletions, corruption and operator errors can propagate. Define RPO (maximum acceptable data loss) and RTO (recovery target), back up regularly and test restoration. The failover procedure must also prevent two primaries from accepting conflicting writes.

## Zero-downtime schema rollout
```text
Expand schema -> deploy dual-compatible app -> backfill in batches
       -> switch readers -> verify -> contract obsolete schema
```
Before dropping a column, ensure older application versions cannot still run or roll back into it. On large tables, index creation and backfill can cause locking, high IO or replication lag depending on DB engine and DDL mode. Apply rate limits and checkpoints.

## Interview: answered
**Can an index make writes slower?** Yes. Every index adds storage, maintenance and possibly contention; evaluate net workload benefit.

**Why can a query regress without changing SQL?** Statistics, data skew, parameter values, table growth, plan cache behavior or DB settings can change the optimizer decision.

**Is REPEATABLE READ always safe for business invariants?** No. Exact anomaly prevention differs by implementation; write skew and constraint design must be assessed against the target engine.

**Should all reads use replicas?** No. Freshness-sensitive reads and transactional read-modify-write flows may require primary or a defined session guarantee.

**How do you prove a migration is reversible?** Deploy old/new compatible readers, test backfill on production-like data, and explicitly distinguish application rollback from irreversible data transformations.
