# JVM diagnostics and concurrency lab

## Distinguish memory pools
A Java process consumes heap, metaspace, JIT code cache, GC structures, native libraries, direct buffers and thread stacks. The operating system can kill a container even when heap occupancy is low. Build a memory budget against the **container limit**, not only -Xmx. Example: a 2 GiB container with -Xmx=1536m has about 512 MiB left for all nonheap/native consumption and headroom; validate against RSS under burst and after warmup.

## Allocation versus retention
High allocation rate is not automatically a memory leak. A leak is retained reachable data increasing over time under a stable workload. Diagnose using post-collection live set, heap histograms and dominator trees. Common culprits include unbounded maps, static collections, thread locals, queues with slow consumers, listeners never detached, and cached graphs holding large subgraphs.

```text
High p99
 |-- Correlates with GC pauses? -> GC logs + JFR allocation and heap occupancy
 |-- CPU high without GC?      -> JFR CPU profiles, hot locks, JIT warmup
 |-- CPU low?                  -> blocked threads, connection pool, external spans
 |-- RSS high, heap stable?    -> direct buffers, metaspace, threads, native leak
```

## Concurrency correctness
Visibility is different from atomicity. The Java Memory Model provides happens-before rules; synchronized monitor operations and volatile publications establish important ordering relationships. A volatile integer is visible but count++ is still read-modify-write, not an indivisible operation.

```java
import java.util.concurrent.atomic.AtomicLong;

public final class RequestMetrics {
    private final AtomicLong accepted = new AtomicLong();

    public long recordAccepted() {
        return accepted.incrementAndGet();
    }

    public long acceptedSoFar() {
        return accepted.get();
    }
}
```
For high-contention statistics where exact immediate reads are unnecessary, consider LongAdder. For invariants spanning several fields, use a lock, an immutable snapshot via AtomicReference, or a transactional boundary. Do not silently assume an atomic counter protects related mutable collections.

## Garbage collector comparison
G1 divides the heap into regions and pursues pause targets through mixed and young collections. ZGC minimizes stop-the-world work and is attractive for latency-sensitive workloads, with CPU and memory trade-offs depending on workload and JDK version. Compare with identical traffic, allocation profiles, pod CPU quotas and heap headroom. A configured pause target is a *goal*, not a latency guarantee. Collect throughput, p99, allocation rate, pause distributions, concurrent GC CPU, and post-GC live-set trend.

## Virtual threads are not a throughput multiplier
Virtual threads make blocking-style concurrency cheaper; they do not create DB connections, CPU cores or downstream API quota. An application with 5,000 waiting virtual threads and a 30-connection pool still has a 30-connection bottleneck. Bound access to scarce resources; measure request cancellation and timeouts, and inspect blocking/pinning behavior on your actual JDK.

## Investigation commands
```bash
# On a host with the target JDK tools installed:
jcmd <PID> VM.flags
jcmd <PID> GC.heap_info
jcmd <PID> Thread.print
jcmd <PID> JFR.start name=incident settings=profile duration=60s filename=/tmp/incident.jfr
```
Never assume these diagnostics are permitted in a locked-down container: check filesystem write access, JDK version, container PID namespace and production overhead before running. Heap dumps can be enormous and sensitive.

## Worked exercise
A pod has a 2 GiB memory limit. Heap appears stable at 1.0 GiB, yet RSS rises toward the limit. Increasing Xmx would reduce native headroom and potentially make failure earlier. Compare direct-buffer allocation, Netty/native activity, thread count and stack usage, metaspace/classloader count and anonymous mappings. Sample at several points to establish **growth**, rather than diagnosing from a single RSS value.

## Senior interview: answered
**Why can GC pause p99 be low while API p99 is high?** Application latency includes locks, pool waits, queues, network and business work. A GC pause histogram is only one contributor.

**Why use AtomicReference for configuration?** It can publish an immutable configuration snapshot atomically, preventing readers from seeing inconsistent combinations of fields.

**How can a large heap worsen latency?** Memory pressure, larger live set, GC overhead and container headroom may make pauses or OOM behavior worse; outcome is collector- and workload-specific.

**Why can ThreadLocal leak memory?** Long-lived threads can retain values beyond request lifetime when cleanup is missing.

**How do you choose G1 versus ZGC?** Based on measured tail latency, throughput, CPU/memory overhead and collector availability on the production JDK, not the collector name.

## Incident evidence
Capture a workload timeline with deployment markers, RSS, heap used after GC, GC pause durations, allocation rate, active threads, pool waits and p99. Record hypothesis and disconfirming evidence before changing heap/collector flags.
