# Cache consistency, hot keys and failure lab

## Choose a consistency contract before a cache
A cache may be an optimization for recomputable data, a nearline read model or a component of an authoritative workflow. Those roles are not interchangeable. If a balance must be correct when money moves, do not accept arbitrary cache staleness. For product descriptions, 30 seconds of staleness may be acceptable. Express the contract in terms of maximum staleness, availability during origin failure and whether read-your-writes matters.

## The stale-fill race
```text
T1 reader: cache MISS
T2 reader: SELECT version=8 from DB
T3 writer: UPDATE DB -> version=9; invalidate cache
T4 reader: puts version=8 into cache AFTER invalidation
T5 next reader: reads stale version=8
```
Cache invalidation alone does not serialize in-flight fills. Possible mitigations include per-key coordination, checking authoritative versions, compare-and-set based on versions, or embedding the version in cache keys. Their correctness depends on where the authoritative version lives and whether old writers can overwrite new values.

## Cache stampede numbers
A hot key receives 2,000 RPS and expires. If the origin lookup takes 80 ms, a naive simultaneous miss wave can create roughly 160 overlapping lookups even under steady Poisson-like arrival; synchronized expiry across many keys can be worse. Single-flight coalescing makes concurrent requests share one refresh. Add jitter to TTLs so many entries do not expire together. Stale-while-revalidate may preserve availability but must be disabled for data with strict freshness.

## Operational fallback
```text
Client -> API -> cache
                 | HIT -> response
                 | MISS -> single-flight -> bounded origin -> cache fill
                 | DOWN -> bounded origin + load shedding
```
If cache fails and every request falls through, the database may be overwhelmed. Predefine an origin concurrency budget, a degraded response policy and alarms for miss-rate spikes. Negative caching reduces repeated lookup for absent IDs but must consider creation shortly after a miss.

## Cache key design
Include tenant and authorization-relevant dimensions when response visibility differs. Canonicalize request parameters consistently and version cache namespaces when response formats change. Avoid accidental cache poisoning via untrusted headers, unbounded key cardinality and caching PII in global shared keys. A CDN needs appropriate Cache-Control, Vary, ETag and explicit private/public rules.

## Design decision matrix

| Technique | Strength | Weakness |
|---|---|---|
| local in-process | minimal latency | per-pod divergence, cold restarts |
| Redis-like shared cache | shared working set | network and cluster dependency |
| cache-aside | simple read path | stale-fill and invalidation races |
| write-through | eager update | write latency, partial failure complexity |
| write-behind | buffered writes | durability/reordering risk |
| CDN | edge latency and offload | invalidation and personalized-content safety |

## Interview: answered
**Why can hit rate be 99% while p99 is terrible?** The 1% misses may dominate the 99th percentile when they involve slow origin calls.

**Does a distributed lock solve stampede permanently?** Lease expiry and paused owners can allow stale fills; compare versions or use fencing where necessary.

**Is TTL a replacement for invalidation?** Only if the maximum stale window is acceptable. TTL bounds age but does not guarantee immediate freshness.

**Should cache errors fail open?** Only with a bounded origin fallback; unbounded fail-open behavior can cause cascading failure.

**What signals prove cache usefulness?** End-to-end latency, avoided origin load, miss penalty, memory cost and effect of cache outage, not hit ratio alone.
