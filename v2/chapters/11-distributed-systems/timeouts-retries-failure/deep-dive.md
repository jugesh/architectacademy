# Distributed failure, deadline and saga lab

## Time budgets are end-to-end
A client gives 900 ms. Authentication takes 120 ms, request routing and validation 80 ms, and a database read 260 ms; about 440 ms remain before serialization and network reserve. A downstream timeout of 1,000 ms cannot be useful because it exceeds the remaining request budget. Pass an absolute deadline or remaining budget, reserve time for cleanup and avoid starting work that has no realistic chance of completing.

## Retry multiplication
```text
Client: 3 attempts
    API gateway: 3 attempts each
        Order service: 3 attempts each
            Payment dependency: up to 27 attempts per user operation
```
Not every error is retryable. Decide which layer owns retries and propagate deadlines. Apply exponential backoff with jitter only if there is time left. A retry budget such as a small fraction of normal requests caps amplification. Idempotency or reconciliation is necessary before retrying side effects.

## Circuit breakers, bulkheads and admission control
A circuit breaker reduces calls to a dependency known to be failing, but it cannot detect every capacity problem. A bulkhead separates concurrency budgets so one dependency does not consume every worker. Admission control rejects excess work before queues grow without bound. Use all three as complementary tools, and instrument pending work and queue wait, not just HTTP errors.

## Saga workflow
```text
Order created -> inventory reserved -> payment authorized -> shipment scheduled
                      |                     |
                  failure -> release    failure -> void/refund
```
A saga is a sequence of local transactions with compensating operations. Compensation is not a database rollback: an email cannot be unsent, refunds are asynchronous, and a provider may be temporarily unavailable. Each forward step and compensation needs an idempotent identity and durable state. Use explicit states such as PENDING, RESERVED, AUTHORIZED, COMPENSATING, COMPLETED and MANUAL_REVIEW, with transitions constrained by expected prior state.

## Leases and fencing
A node holds a distributed lock lease, pauses for GC, and wakes up after another node acquired the expired lock. Both may believe they own the work. A monotonically increasing fencing token, validated by the protected resource, stops the old holder from modifying shared state. If the resource cannot validate tokens, the lock by itself does not create a strong correctness boundary.

## SLO and error budget
An SLO of 99.9% successful requests across 1 million eligible requests permits 1,000 failures in the measured window. Define eligible requests, treatment of client cancellations and the latency criterion before calculating. Error-budget burn rate matters more than a single day's percentage. A high burn rate during release can justify stopping deployment and reducing risk.

## Interview: answered
**Why is a timeout not proof the operation failed?** The remote side may commit before the response is lost. Reconcile ambiguous outcomes.

**What is the difference between timeout and deadline?** Timeout bounds a local wait; deadline fixes the end-to-end latest acceptable completion time.

**How can a breaker show healthy while the system is melting?** Calls may succeed slowly, consuming concurrency; monitor latency, saturation and queues.

**Can a saga deliver atomic transactions across services?** No. It provides eventual workflow coordination and compensation, with intermediate states exposed by design.

**What is the failure mode of an expiring distributed lock?** Stale owners may resume after lease expiry and overwrite new work without fencing.
