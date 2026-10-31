import {p,code,table,qa,refs,section,warn} from '../lesson-helpers.mjs';
export const observabilityDepth=[
{after:'identity',...section('trace-journey','API to Kafka to database',
p('Follow order O rather than a collection of dashboards. At 10:00:00 the API accepts command K and commits order O plus outbox event E. At 10:00:02 the relay publishes E. At 10:00:04 fulfillment consumes it and commits local state plus its receipt. The HTTP request, relay task and consumer invocation are different executions. A useful evidence model explains both their elapsed time and the durable business relationship between them.')+
table(['Boundary','Durable evidence','Telemetry to correlate'],[['HTTP acceptance','Command K, order O, accepted time and outbox E commit together','Server span, route template, acceptance result and local commit duration.'],['Outbox relay','E, aggregate version, claim epoch and publication observation','Publish attempt span, broker acknowledgement latency, oldest pending age.'],['Broker delivery','Topic/partition/offset or queue delivery reference','Receive/process spans under the selected instrumentation conventions.'],['Consumer commit','Consumer/E receipt plus resulting order state','Processing span, transaction timing, classified outcome and attempt count.'],['Business completion','Fulfilled time or explicitly unresolved state','Accepted-to-completed SLI independent of trace sampling.']])+
p('The trace explains a particular observed execution. O and E join executions that were retried, delayed, sampled out or replayed later. Retain the minimum business evidence required for recovery in the authoritative system, with suitable access and retention. A telemetry backend is not the only ledger of whether an order was accepted or whether shipment was requested.')+
code(`Illustrative structured outcome events — IDs below are placeholders:
{"service":"orders","operation":"order.accept","orderId":"O7",
 "eventId":"E91","requestId":"R82","outcome":"COMMITTED",
 "traceId":"<trace-A>","release":"orders-2026-11-01"}
{"service":"relay","operation":"event.publish","orderId":"O7",
 "eventId":"E91","attempt":2,"outcome":"ACKNOWLEDGED",
 "traceId":"<trace-B>"}
{"service":"fulfillment","operation":"event.apply","orderId":"O7",
 "eventId":"E91","consumer":"fulfillment-v1",
 "outcome":"ALREADY_APPLIED","traceId":"<trace-C>"}`)+
p('Do not infer that trace A, B and C must be identical or unrelated. Instrumentation may continue extracted creation context, create links or start a new trace according to the operation and conventions. A delayed batch can have several causal inputs that do not fit a single parent. Check the selected messaging instrumentation instead of manually forcing every event in a multi-day workflow under one HTTP span. The business IDs remain useful whichever valid trace relationship is chosen.')+
p('When serializing an event or outbox row, explicitly decide which trace metadata to retain as causality evidence. Trace context has a lifetime distinct from business identity. On a replay after the old trace expired, a new processing trace linked to the original context can be appropriate; replay still uses E as its event identity. Never turn a newly generated trace ID into a new idempotency key.')+
p('To diagnose a missing order, begin at the latest authoritative state, then walk backward through E and K. If no local receipt exists, inspect delivery and parsing. If a receipt exists but final state is absent, the receipt protocol or the meaning of completion may be wrong. If state is correct but the UI shows old data, follow the read projection/cache path. This ordering narrows the investigation before searching every service log.')+
qa([['Advanced','What does a producer span ending successfully prove?','It proves only the operation and acknowledgement boundary that the instrumentation measured. It does not prove the consumer committed, the customer received the result or the durable business deadline was met. Pair the span with broker semantics and downstream state evidence.'],['Intermediate','Should an event’s payload carry a full customer object just to improve debugging?','No. Carry the required business contract and minimal controlled correlation metadata. Debug convenience does not justify copying secrets or unnecessary personal data into every broker, log and trace destination.']])+
refs([['https://opentelemetry.io/docs/specs/semconv/messaging/messaging-spans/','OpenTelemetry messaging spans','creation/processing context and causal relationships.']]))},
{after:'java-context',...section('java-propagation','Trace context in Java',
p('There are two separate tasks: transporting context across a process boundary and making the correct context current while code executes. A trace header stored on a message is inert until the receiver extracts and scopes it. Conversely, a Java thread-local scope does not inject headers into an outgoing message by itself. Supported automatic instrumentation often handles these steps; test it before adding a second manual span around the same boundary.')+
code(`// Illustrative manual single-message processing, with auto-instrumentation
// for THIS boundary disabled. GETTER implements TextMapGetter<Carrier>.
// tracer, propagators, handler and sanitization are configured dependencies.
Context parent = propagators.getTextMapPropagator()
    .extract(Context.root(), message.carrier(), GETTER);
Span span = tracer.spanBuilder("fulfillment.process")
    .setParent(parent)
    .setSpanKind(SpanKind.CONSUMER)
    .startSpan();
try (Scope scope = span.makeCurrent()) {
  handler.applyInLocalTransaction(message); // receipt + effect
  span.setAttribute("app.outcome", "applied");
} catch (RuntimeException failure) {
  span.setStatus(StatusCode.ERROR, "processing failed");
  span.recordException(sanitizedException(failure));
  throw failure; // preserve delivery/recovery behavior
} finally {
  span.end();
}`)+
p('This is a single-message relationship example, not a universal replacement for the active semantic conventions. A batch or processing operation inside another ambient context may use links or another parent policy. The carrier getter must implement safe extraction and the configured propagator must parse the actual wire format. Missing or invalid incoming context should not prevent legitimate business processing; it changes available correlation, not authorization.')+
p('The try-with-resources scope restores the previous current context on the executing thread even when the handler throws. The finally block ends the span. Catching the exception only to record telemetry and then swallowing it can acknowledge failed work, depending on the listener container. Preserve the framework’s error/acknowledgement semantics separately from span status.')+
code(`// Executor boundary: capture execution context at submission time.
Context captured = Context.current();
executor.execute(captured.wrap(() -> {
  // Current context restored for this task's scope by the wrapper.
  processOneBoundedTask();
}));

// Outgoing carrier: inject the selected current context explicitly
// if the chosen client instrumentation does not already do so.
propagators.getTextMapPropagator()
    .inject(Context.current(), outgoingCarrier, SETTER);`)+
p('Capturing one Context in a singleton at startup and reusing it for all tasks associates unrelated requests with the same context. Capture at the intended handoff. The executor still needs bounded admission, cancellation and lifecycle rules. Context propagation does not make a task durable or force a task to stop when its parent request returns.')+
p('MDC is a separate logging integration. Some supported bridges populate trace/span fields for the active observation; a manual MDC map for business fields needs scoped restoration too. If you replace an executor worker’s existing map, restore the previous map in finally rather than leaving another request’s identity behind. A proof test submits two unrelated requests to a reused single worker and checks both propagation and cleanup.')+
p('Treat baggage as propagated metadata with a cost and trust boundary. Allowlist what may leave the service and bound its size. Never use an incoming trace/baggage tenant field to authorize an order; derive identity from the authenticated resource contract. Avoid secrets, tokens and personal payloads in attributes and recorded exception messages. The sanitization helper in the outline is deliberate: raw exception text can contain SQL values or upstream response content.')+
qa([['Advanced','Why use Context.root() as the extraction base in this outline?','It avoids accidentally inheriting an unrelated ambient thread context for this standalone message boundary. The correct parent/link strategy depends on the instrumentation and operation. A receiver intentionally nested inside another operation may need to preserve that relationship with a supported link/parent policy.'],['Intermediate','Can Java ScopedValue alone replace this message carrier?','No. In-process scoped data does not serialize itself across HTTP or a broker. Distributed extraction/injection, span lifecycle, logging integration and durable operation identity remain separate responsibilities.']])+
refs([['https://opentelemetry.io/docs/languages/java/api/','OpenTelemetry Java API','context scopes, span lifecycle and propagators.']]))},
{after:'metrics',...section('slo-workbook','Measure completed orders',
p('“99.5% of accepted orders reach fulfillment within five minutes” sounds precise until we choose its population. Counting HTTP attempts permits client retries to inflate the denominator. Counting only completed orders excludes the missing ones. Comparing completions this minute to acceptances this minute mixes different cohorts when work is delayed. Start with one durable order identity and a deadline measured from its accepted time.')+
p('At evaluation time T, choose accepted orders from [T−65 minutes, T−5 minutes). This is a one-hour acceptance cohort whose entire five-minute completion allowance has elapsed. Evaluate whether each member’s first valid fulfillment time is no later than its own accepted time plus five minutes. Late and still-missing members are bad events for this objective. Younger accepted orders are reported as pending separately until their allowance matures.')+
code(`-- Illustrative PostgreSQL cohort calculation on authoritative facts.
-- Business eligibility rules and a fixed :evaluation_time are explicit inputs.
WITH cohort AS (
  SELECT accepted_at, fulfilled_at
  FROM order_outcome
  WHERE eligible_for_fulfillment_slo = true
    AND accepted_at >= :evaluation_time - interval '65 minutes'
    AND accepted_at <  :evaluation_time - interval '5 minutes'
)
SELECT count(*) AS eligible,
       count(*) FILTER (
         WHERE fulfilled_at <= accepted_at + interval '5 minutes'
       ) AS on_time
FROM cohort;`)+
p('A null fulfilled_at does not satisfy the on-time condition, so an unresolved member remains in the denominator and is not counted as successful. The query is a reference calculation, not a suggestion to repeatedly scan an unindexed production ledger. Define the outcome model and suitable projection/index/aggregation for scale. Keep source identities so the aggregate can be reconciled and corrected after delayed evidence.')+
table(['Illustrative matured cohort','Count','Interpretation'],[['Eligible accepted orders','100,000','One entry per order under the fixed eligibility rule.'],['Fulfilled within five minutes','99,350','Measured SLI = 99.35%.'],['Late or still unresolved','650','Bad fraction = 0.65%.'],['Allowed bad events at 99.5% target','500','0.5% × 100,000.'],['Observed/allowed bad fraction','1.3','Burn ratio for this cohort = 0.65 / 0.5.']])+
p('This 1.3 ratio says this cohort consumed bad-event allowance faster than the target rate. It is not by itself a complete paging policy. Choose short/long windows, low-traffic handling, sustained burn criteria and an actionable owner. A denominator of zero is no eligible traffic, not automatic proof of perfection. Publish the evaluation lag so people understand why the most recent five minutes are absent from this matured-cohort score.')+
p('Define cancellation and exclusions in advance. If a customer legitimately cancels before fulfillment, decide whether that order belongs in this objective and record the rule. Do not remove incident-caused failures retroactively to improve the score. A separate acceptance SLO can count requests rejected or timed out before an order became durable; the completion objective covers already accepted work. Both are needed to describe the journey.')+
p('Use bounded metric dimensions such as workflow, region and outcome class. Put individual order IDs in access-controlled logs or the ledger. A trace may be sampled out without changing the authoritative count. Likewise, an HTTP timer or a sampled trace’s duration is not the durable accepted-to-fulfilled measurement for work that continues after the response.')+
qa([['Advanced','If the fulfillment timestamp arrives late in telemetry but was durably recorded on time, is the order necessarily late?','No. Distinguish business completion time from observation/ingestion time. Reconcile delayed evidence under a documented correction policy, while separately measuring telemetry freshness. Do not let an exporter delay silently redefine the business deadline.'],['Intermediate','Why not count every retry as another accepted order?','A retry of the same accepted intention does not create another customer outcome. Use the durable order/command identity to avoid multiplying the denominator and masking unresolved work.']]))},
{after:'worked',...section('incident-workbook','Investigate a stranded order',
p('An illustrative incident begins with HTTP availability at 99.99% while paid-to-fulfillment age climbs. Order O7 is PAID, but the customer has no shipment. The goal is to determine the first missing or incorrect durable transition, choose a safe mitigation and prove the final outcome. Opening the busiest dashboard first can waste the evidence already available in the order ledger.')+
table(['Observation','Hypothesis','Discriminating check'],[['O7 PAID, outbox E91 pending','Relay cannot progress','Check pending age, claim/lease state, send outcome and broker acknowledgement.'],['E91 published, no fulfillment receipt','Delivery, parsing or consumer path failed','Locate source position/delivery reference and classified consumer outcome.'],['Receipt says completed, order not advanced','Receipt/effect boundary or completion definition is wrong','Inspect the same local transaction and domain transition result.'],['Order fulfilled, customer reads PAID','Read model/cache is stale','Compare projection source version and invalidation/freshness policy.'],['No spans retained','Sampling/retention or propagation gap','Use O7/E91, structured outcomes and durable state first.']])+
p('In this incident, E91 carries schema version 3, while an old consumer accepts only version 2. The event is quarantined before its effect. A rising queue depth is not the primary fact; incompatible readers are preventing completion. Increasing replicas of the old reader increases capacity for the wrong behavior. Validate a compatible consumer with representative version-2 and version-3 messages and the same duplicate/replay semantics before releasing the backlog.')+
code(`Illustrative investigation record:
  affected workflow: paid -> fulfillment-ready
  first broken boundary: event schema validation
  affected cohort: schema v3 events since release R
  durable source: topic/partition/offset + event identity E
  protected invariant: one fulfillment effect per accepted intention
  mitigation: compatible reader, bounded authorized replay
  stop if: transition conflicts, duplicate effects or DB saturation rise
  success evidence: cohort reconciled, oldest unresolved age bounded`)+
p('Authorize replay by an explicit cohort, preserve E91 and its original business references, and record the recovery attempt separately. If the first attempt committed the effect but acknowledgement was lost, the receipt must make replay harmless. If the event was only parked, the parked-to-applied protocol must actually run. A recovery script that replaces all event IDs bypasses those protections and can create duplicate shipments.')+
p('During the recovery, compare useful application rate with the constrained database/provider budgets. Monitor the oldest affected event, total unresolved cohort, duplicate recognition, transition conflicts and final business outcomes. A falling DLQ count is not enough: the items could have been deleted without being applied. Reconcile applied, already applied, intentionally rejected and still unresolved identities.')+
p('Close the incident with a test that reproduces the original compatibility boundary and verifies mixed-version rollout. Add a symptom alert on accepted/paid work missing its deadline, with links to the relevant cohort and runbook. Also monitor telemetry export drops and freshness, because silence from a broken evidence pipeline can otherwise resemble recovery. Retention and access controls should support the investigation without copying customer payloads into an unrestricted incident note.')+
qa([['Advanced','What proves recovery if every trace from the outage has expired?','A reconciled durable cohort: each original intention has its allowed final state or an explicitly owned unresolved result, no duplicate effect occurred, and resource/age targets are healthy. Historical traces would help explain execution but are not the sole proof of business recovery.'],['Intermediate','Should the alert say “Kafka is down” because order age is high?','No. Alert on the observed symptom and attach diagnostic hypotheses. High age can come from publication, schema validation, database locks, a provider or a stale read model. Evidence must identify the failing boundary before naming the cause.']]))}
];
