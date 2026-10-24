# Capacity and scaling lab

## Problem statement
You operate a stateless checkout API on Kubernetes. The baseline is 450 requests per second, the burst target is 1,200 RPS, and the API has a 300 ms p99 objective. Calls require a PostgreSQL lookup and sometimes write an order. A downstream database has a connection limit. Your architecture must tolerate loss of one application replica without an uncontrolled queue.

## First-principles model
**Little's Law is about averages, not a percentile:** L = λW for a stable system. At 450 RPS with mean response time 0.18 seconds, approximately 81 requests are in progress. If the same traffic starts taking 0.8 seconds, in-flight requests rise to about 360. This does not imply throughput improved; it means more work accumulated. Distinguish end-to-end latency, service CPU demand, database occupancy and queue wait.

If each request uses 15 milliseconds of CPU at a sustained 1,200 RPS, application CPU demand is 18 core-seconds per second, before GC, TLS, logging and headroom. If each request holds a DB connection for 25 milliseconds, expected average active connections under this simplified workload is 30. A pool cap of 25 will cause waits at that arrival rate unless batching, caching or query reduction changes service demand. It is dangerous to multiply the pool size by replica count without checking database limits.

## Architecture
```text
Clients -> CDN/WAF -> ALB -> [API pod A | API pod B | API pod C]
                                   |             |
                              bounded pool   bounded pool
                                   \             /
                                    PostgreSQL
                                             |
                                   asynchronous outbox
                                             |
                                            queue -> workers
```
The load balancer is not the bottleneck by default. Every arrow needs a measured concurrency bound. API pod readiness must mean it can safely receive work, not merely that the process responds to an HTTP GET. Startup probes, graceful termination and connection draining matter during scale events.

## Execute the experiment
1. Collect traffic mix, payload sizes, cache-hit rate, and one-week p50/p95/p99 distributions. Separate read and write operations.
2. Run steady steps at 200, 450, 700, 900 and 1,200 RPS, each long enough to reach equilibrium. Run a separate short burst test.
3. Capture incoming RPS, successful RPS, CPU throttling, pool-acquisition wait, database query time, queue depth and error rates.
4. Plot offered traffic versus completed traffic. The **capacity knee** is where completed throughput stops keeping pace while queues and tail latency rise.
5. Terminate one pod and then simulate database slowdown. Verify overload is bounded and recovers without retry storms.

## Decision table

| Symptom | Likely cause | Validate before changing |
|---|---|---|
| CPU ~100%, DB idle | CPU saturation | per-request CPU profile, GC and throttling |
| CPU idle, pool wait grows | DB connection bottleneck | active/idle/pending connections |
| p99 rises, RPS flat | queueing or dependency slowdown | span time decomposition |
| more pods make DB slower | overload amplification | total connections and query concurrency |
| HPA scales late | lagging autoscaling metric | startup duration and backlog age |

## Implementation: bounded downstream concurrency
```java
final Semaphore permits = new Semaphore(40, true);

Response handle(Request request) throws InterruptedException {
    if (!permits.tryAcquire(75, TimeUnit.MILLISECONDS)) {
        throw new ServiceOverloadedException("Retry with backoff");
    }
    try {
        return service.process(request);
    } finally {
        permits.release();
    }
}
```
This sketch is intentionally framework-agnostic: in real services, map overload to a documented HTTP response, instrument rejection rates, preserve interruption and avoid nesting unbounded blocking calls. The semaphore is **per process**, not a global DB limiter; choose its size with replica count in mind.

## Design interview: answered scenarios
**A. Why does p99 rise before CPU reaches 100%?** Pool contention, lock waits, per-core hotspots and queueing can dominate latency. Aggregate CPU averages hide unequal utilization and long-tail service times.

**B. Can Little's Law predict replica count?** Not alone. It describes stable average concurrency, whereas replicas depend on CPU demand, IO waits, pool limits, target utilization and failure headroom.

**C. Should you scale on Kafka lag or CPU?** For backlog-driven workers, use lag **age** and the ratio of arrival and processing rates, subject to downstream limits. Raw lag count is not a universal scaling signal.

**D. What is the effect of a retry policy on capacity?** At 5% failures, retrying once adds roughly 5% attempt load if failures are independent; cascading failures can make attempts multiply at several layers. Apply a retry budget.

**E. How would you validate one-zone resilience?** Run load at the stated peak while one zone is absent; confirm remaining zones hold target throughput, p99 and DB connection budget without assuming instantaneous autoscaling.

## Review checklist
- [ ] Define arrival rate, completed throughput, latency objective and maximum backlog.
- [ ] Measure CPU-seconds/request and DB connection-seconds/request separately.
- [ ] Prove overload rejection and retry behavior using fault injection.
- [ ] Reserve capacity for a replica or zone failure as required.
- [ ] Document the test conditions under which the capacity claim is valid.
