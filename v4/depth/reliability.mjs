import {p,code,table,qa,refs,section,warn} from '../lesson-helpers.mjs';
export const reliabilityDepth=[
{after:'deadlines',...section('deadline-budget','Spend one deadline',
p('A timeout is a bound on a particular wait; an end-to-end deadline is the latest useful completion time for the logical request. Giving every nested layer one second does not make a one-second API. The caller can wait for admission, a connection, an attempt, a backoff and a second attempt in succession. All of those stages must spend the same finite budget, with room left to record an outcome and send the response.')+
table(['Illustrative stage','Elapsed budget','Remaining from 1,000 ms'],[['Admission and request setup','80 ms','920 ms'],['Local intent transaction','100 ms','820 ms'],['Provider envelope, including attempts and backoff','At most 600 ms','At least 220 ms'],['Record result and serialize response','Reserve 120 ms','At least 100 ms headroom']])+
p('These numbers are a worksheet, not latency measurements or production settings. The provider envelope might contain two attempts capped at 250 ms each and 70 ms backoff, leaving 30 ms of its own headroom. That arithmetic is only a plan: scheduler delay, connection acquisition and actual client timeout semantics determine whether the real call obeys it. Recalculate remaining time immediately before every blocking stage.')+
code(`// Illustrative Java deadline arithmetic for one process.
// Enforce bounds in the actual wait/client, not only in this helper.
long deadline = System.nanoTime() + Duration.ofSeconds(1).toNanos();
long responseReserve = Duration.ofMillis(120).toNanos();

long usableNanos(long deadline, long reserve) {
  long remaining = deadline - System.nanoTime() - reserve;
  if (remaining <= 0) throw new DeadlineExceeded();
  return remaining;
}

// Before a provider attempt:
long cap = Math.min(Duration.ofMillis(250).toNanos(),
                    usableNanos(deadline, responseReserve));
// Apply cap to a client/wait whose scope is understood.
// Before backoff: require enough time for backoff + a useful next attempt.`)+
p('Use a monotonic clock for elapsed time inside one process. Do not transmit System.nanoTime values between machines; their origins are not a shared timestamp. An inter-service deadline protocol needs an explicit representation, validation and clock/skew policy, and the receiving service should clamp it to its own limits. Untrusted callers cannot demand unlimited resources by sending a very distant deadline.')+
p('Connection establishment, pooled-connection acquisition, response headers and streaming body consumption may have different limits in a chosen HTTP client. Check the actual request factory/transport underneath a Spring client. A connect timeout can be irrelevant on a reused connection. A timeout for response headers may not bound consuming an endless body. A future timeout may return control while underlying I/O keeps running.')+
code(`// Native JDK HTTP example of two DIFFERENT scopes; illustrative only.
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofMillis(100))
    .build();
HttpRequest request = HttpRequest.newBuilder(providerUri)
    .timeout(Duration.ofMillis(250))
    .header("Idempotency-Key", originalProviderKey)
    .POST(HttpRequest.BodyPublishers.ofString(canonicalPayload))
    .build();
// Choose a bounded body handling policy and classify the outcome.
// Verify cancellation/resource release with this exact transport.
// Do not create a new HttpClient for every request.`)+
p('If the deadline expires after a remote write may have been accepted, the local result is unknown, not declined. The durable operation must remain recoverable even when the original HTTP response can no longer wait. Release request resources, expose a status identity and let a separately budgeted worker reconcile the original provider operation. A recovery workflow has its own deadline and escalation policy; it should not inherit an already-expired ingress budget forever.')+
qa([['Advanced','Why reserve response time if the caller has already timed out?','Before expiry it improves the chance of returning a useful bounded response. After expiry, durable recovery still matters, but serializing a late HTTP response is no longer the business completion mechanism. Separate request-resource lifetime from operation lifetime.'],['Intermediate','Does interrupting a Java waiting thread undo a provider charge?','No. Interruption or cancellation can affect local waiting and sometimes underlying work, depending on the client. It is not a remote transaction rollback. Recover using the stable provider identity and its supported inquiry contract.']])+
refs([['https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.Builder.html','JDK HttpClient builder','connection timeout scope.'],['https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html','JDK HttpRequest builder','request timeout configuration.'],['https://docs.spring.io/spring-framework/reference/integration/rest-clients.html','Spring REST clients','transport selection and configuration boundaries.']]))},
{after:'retries',...section('retry-composition','Retry composition and load',
p('A retry policy has at least four decisions: whether repetition is safe, whether this outcome might improve, whether time remains and whether the dependency can afford another attempt. Backoff answers none of those by itself. A payment decline is usually a business result, not a transport failure to retry. A lost response after a charge may require inquiry rather than another submission, even when submission has a stable provider key.')+
table(['Observed outcome','Example classification','Action to defend'],[['Input rejected as invalid','Deterministic request failure','Correct input; do not retry unchanged.'],['Connection failed before a supported safe read','Potentially transient','Bounded repeat if deadline/load budget permits.'],['Provider says throttled','Capacity signal','Respect supported retry guidance and global admission limits.'],['Write sent, response missing','Potentially committed effect','Preserve UNKNOWN; reuse supported identity/inquire.'],['Circuit or bulkhead rejects locally','No new downstream attempt by this layer','Do not spin-retry into the same exhausted guard.']])+
p('Assign retry ownership. Suppose the gateway, application and HTTP adapter each make up to three total attempts. One logical command can cause 3 × 3 × 3 = 27 provider attempts, before client retries. The original request count can look normal while the provider is overloaded. Inventory every retrying layer, including SDK defaults, and report attempts per original command alongside final success.')+
code(`// Illustrative Resilience4j composition, using application-defined types.
RetryConfig retryConfig = RetryConfig.custom()
    .maxAttempts(2) // total calls: initial + at most one retry
    .waitDuration(Duration.ofMillis(70))
    .retryOnException(this::isSafeTransientFailure)
    .build();
Retry retry = Retry.of("provider-read", retryConfig);

Supplier<Response> guardedAttempt = Bulkhead.decorateSupplier(
    bulkhead, () -> oneBoundedAttempt(command, deadline));
guardedAttempt = CircuitBreaker.decorateSupplier(breaker, guardedAttempt);
Supplier<Response> logicalCall = Retry.decorateSupplier(retry, guardedAttempt);
Response response = logicalCall.get();`)+
p('The example makes retry outermost: each attempt passes through the breaker and bulkhead. The semaphore permit is released between synchronous attempts, so backoff does not occupy an execution permit in this composition. The breaker sees attempt outcomes. Reversing the wrappers changes the meaning: a breaker outside retry observes one final logical outcome, and a bulkhead outside the whole operation can hold capacity while it sleeps. Both need deliberate measurement, not an assumed annotation order.')+
p('The custom predicate must reject local circuit-open/bulkhead-full errors and unsafe or deterministic failures; the code above does not define that domain decision for you. Configure what the breaker counts as failure too, so local capacity rejection is not accidentally interpreted as evidence of provider failure. The fixed 70 ms wait illustrates composition only. A real retry loop also needs jitter, a remaining-deadline gate before sleeping and a useful minimum attempt budget. Do not ship the illustrative configuration as a complete deadline policy.')+
p('Choose whether to retry exceptions, specific result classes or neither. A transport adapter that converts every HTTP status to a successful Response can hide failures from an exception-only policy. Conversely, mapping every non-2xx response to “retryable” can repeat a permanent rejection. Preserve a small, explicit outcome classification at the adapter boundary, including the distinction between safe read failure and unknown write result.')+
p('A semaphore bulkhead limits concurrent execution within that instance; the fleet can still multiply concurrency as pods scale. A circuit breaker reacts to the observations and sample policy it has seen. Neither is a distributed global quota nor a substitute for the transport’s timeout. During recovery, cap probes and ramp admitted work so a newly responsive provider does not immediately receive the entire queued demand.')+
qa([['Advanced','Why can a high final success rate hide a worsening incident?','Retries can rescue final responses while consuming much more downstream capacity and latency budget. Compare attempts per logical command, useful completions, first-attempt failures, queue age and resource occupancy.'],['Intermediate','Does maxAttempts=2 mean two retries?','For the illustrated Resilience4j Retry configuration it includes the initial invocation: at most two total calls. Confirm terminology at every layer; libraries do not all use the same counting convention.']])+
refs([['https://resilience4j.readme.io/docs/retry','Resilience4j Retry','attempt counting, predicates and intervals.'],['https://resilience4j.readme.io/docs/circuitbreaker','Resilience4j CircuitBreaker','recorded outcomes and state transitions.'],['https://resilience4j.readme.io/docs/bulkhead','Resilience4j Bulkhead','semaphore and bounded-pool variants.']]))},
{after:'worked',...section('payment-recovery','Recover an unknown payment',
p('Replace the phrase “retry the payment” with a state machine for one durable payment intention. Store payment identity P, order identity O, amount/currency, provider operation key K and an immutable request fingerprint. A response timeout changes what we know; it does not change the amount the customer intended to pay. Every submission or inquiry must refer to that same intention under the provider’s supported contract.')+
table(['Local state','Meaning','Permitted recovery'],[['PENDING','Intent committed; no conclusive provider outcome recorded','A bounded worker may submit using K under a claim.'],['UNKNOWN','A submission might have succeeded; evidence is incomplete','Inquire/reconcile K; repeat only as the provider contract permits.'],['SUCCEEDED','Authoritative success recorded for this intention','Emit one durable next-step intent; handle repeat callbacks idempotently.'],['DECLINED','Conclusive negative business outcome for this intention','Return the result; a new legitimate intention requires explicit policy.'],['REVIEW_REQUIRED','Automatic resolution cannot safely establish the outcome','Assign an owner, preserve evidence and prevent blind new-key charging.']])+
p('A worker acquires a bounded claim, performs the provider operation outside a lock-holding local transaction, then records the observation with a conditional transition. A lease epoch can prevent a stale worker from overwriting newer database state. The provider key and immutable request protect remote identity; an epoch alone cannot fence a provider that does not understand it. Use both boundaries for their distinct purposes.')+
code(`Illustrative recovery loop, not a vendor API:
1. Read/claim durable intention P; capture claim epoch e.
2. If known SUCCEEDED or DECLINED, return its recorded result.
3. Inquire provider operation K when outcome is UNKNOWN.
4. If contract permits submission/repetition, use K + original payload.
5. Record the observed outcome with expected state/epoch conditions.
6. If transition to SUCCEEDED wins, insert OrderPaid outbox intent
   in that SAME local transaction.
7. If outcome stays unknown, schedule bounded reconciliation.
8. If contract/retention makes safe inquiry impossible, escalate P.
Never generate a fresh provider key merely because a response timed out.`)+
p('Callbacks race polling. Treat both as observations of P and validate their authenticity, provider reference, amount and currency before applying a transition. If the success transition has already won, a repeated success should not emit a second business effect. If a callback conflicts with a previously recorded terminal result, preserve evidence and reconcile according to the provider/domain model instead of silently overwriting history.')+
p('Now race reservation expiry. Inventory reservation R expires while payment P is UNKNOWN. If the seat or stock was released and resold, a later success for P cannot simply confirm R. The recovery policy can seek another allocation, issue a repeat-safe refund or route an exception, depending on the business promise. Payment success and fulfillment permission are related facts, not interchangeable states. Compensation itself has identity, uncertain outcomes and retry/reconciliation requirements.')+
p('Provider retention bounds the guarantee. If K is forgotten after a provider-defined interval and inquiry is no longer possible, replaying the original local intent may create a new effect despite using the same string. Align local reconciliation deadlines and retained evidence with the actual contract. Recovery after restoring an old local backup must also compare provider facts before replaying old pending intentions.')+
qa([['Advanced','If a worker lease expired, may another worker submit with a new provider key?','No. Worker ownership and business intention are different identities. A takeover continues P with its original K and payload under the supported provider recovery protocol. A new key risks a second charge.'],['Advanced','Is REFUNDED the same as the original payment never succeeding?','No. A refund is another business action after a charge and can have its own delay, failure, fees and audit obligations. Preserve both facts; do not rewrite the original result to pretend no effect happened.']]))},
{after:'pitfalls',...section('resilience-drill','Prove recovery under failure',
p('A resilience demonstration needs an expected final business state and resource bounds before the fault is injected. “The retry annotation fired” does not show that an order remained correct or that the service released its scarce connections. Start with a single intention and controlled failure points, then repeat under realistic concurrent demand.')+
table(['Fault injection','Correct business evidence','Resource evidence'],[['Provider accepts, response is dropped','One provider intention, UNKNOWN then reconciled SUCCEEDED','Request wait ends; connections/tasks do not accumulate indefinitely.'],['Local process dies after provider success','Original P/K recovered; no fresh-key duplicate','A later worker takes over under bounded ownership.'],['Dependency stalls all calls','Accepted work remains recoverable; optional work follows degradation policy','Bounded active calls, acquisition wait and queue size.'],['Circuit opens','Rejected calls classified separately; no fabricated success','Limited probes and stable healthy-dependency capacity.'],['Recovery worker crashes after local success commit','One next-step outbox intent; repeat observation is harmless','Backlog age eventually falls without a retry storm.'],['Late success after inventory expiry','Explicit recovery/compensation state','Unresolved tail has an owner and age bound.']])+
p('Compare useful throughput before, during and after the fault. If 100 logical commands produce 700 attempts, sevenfold amplification may be the actual incident even if most eventually succeed. Record how much of the deadline was spent acquiring a connection, executing a call and backing off. Keep instrumentation independent enough that an exporter outage does not erase the durable business status.')+
code(`Illustrative operating review:
  logical commands admitted:        100/s
  provider attempts:               300/s
  useful completions:               60/s
  unresolved creation rate:         40/s
  recovery completion rate:         20/s
  unresolved backlog growth:        20/s

Conclusion: final HTTP responses alone cannot establish recovery.
Either reduce unresolved arrivals, increase validated recovery capacity,
or apply an explicit business policy. More retry attempts are not
necessarily more useful completions.`)+
p('Test cancellation against the exact configured client. After the outer request has timed out, inspect active sockets, executor tasks, pool permits and downstream work. If underlying tasks continue indefinitely, repeatedly timing out callers can hide an ever-growing resource leak. Bound transport waits, body handling, queues and concurrent admissions together. Avoid a large new thread pool that merely moves the same waiting work to a less visible location.')+
p('Define a safe stop condition for a fault exercise: excessive error-budget burn, invariant violation, recovery lag or resource exhaustion. Reserve operator capacity and a route to disable the experimental fault. On recovery, ramp toward the measured useful-completion limit while monitoring the cold-cache, reconnect and retry surge. The end condition includes resolving or explicitly owning the oldest unknown intentions, not only a green health probe.')+
qa([['Advanced','Can a fallback return payment success from cache while the provider is unavailable?','Only if it is returning an already authoritative recorded result for that same intention under the authorization contract. Fabricating a new success to keep HTTP green violates correctness. For an unresolved new intention, return the defined pending/unknown behavior.'],['Intermediate','What is the strongest evidence that the bulkhead worked?','The intended concurrency stayed bounded and unrelated critical work retained its required capacity, while rejected/deferred work followed the documented business policy. A count of BulkheadFull exceptions alone does not establish those outcomes.']]))}
];
