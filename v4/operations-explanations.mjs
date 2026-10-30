import {p,qa} from './lesson-helpers.mjs';
const content={
reliability:{
problem:[
'The earlier lessons made local state correct and pending work durable. A dependency can still be slow, unreachable or uncertain. Reliability asks whether the required business function remains correct and recoverable under those conditions. Availability of a process is only one part: an HTTP 202 with permanently stranded orders is not successful completion.',
'Follow one payment call. The provider can reject it, accept it and respond, or accept it while its response disappears. A timeout stops the caller’s wait without distinguishing those outcomes. Resource protection and business recovery therefore need different mechanisms, introduced below before combining them.'
],
requirements:[
'Define eligible requests, acceptance and completion targets, and forbidden effects. State which work can be delayed and which facts must survive a crash. A payment operation may become pending/unknown without being declined; the caller needs a durable status path and an owner for reconciliation.',
'Include finite resource and recovery budgets. How long may requests wait, how many may wait together, how much retry traffic is allowed, and how old may unresolved operations become? These choices connect reliability to capacity. A policy that retries forever can preserve neither latency nor bounded cost.'
],
deadlines:[
'A timeout usually bounds a particular wait according to a client/library’s semantics. A deadline bounds the useful lifetime of a logical operation across waits and attempts. Allocate remaining time for admission, connection acquisition, dependency work, local commit and response handling; do not give every nested call a fresh original budget.',
'Cancellation may stop local interest without undoing work already accepted elsewhere. Verify whether the underlying client releases connections/tasks, and preserve durable recovery for possible side effects. A shorter future timeout that leaves network work running can hide resource consumption instead of limiting it.'
],
retries:[
'Retry only after establishing safe repetition, a potentially transient failure and remaining time/load budget. Validation errors need corrected input, while an ambiguous unsafe write needs identity/inquiry rather than a new intention. Keep attempt identity separate from the stable business identity.',
'Backoff and jitter spread attempts; they do not make an unsafe effect safe. Multiple retry layers can multiply downstream calls, so choose an owner and count the initial attempt consistently. Reconciliation may continue durably after the original HTTP deadline, under its own bounded policy and unresolved-tail handling.'
],
isolation:[
'A circuit breaker can stop some future calls after observed failure behavior; a bulkhead limits how much shared capacity one dependency or workload can occupy. Neither automatically cancels calls already in flight. Bound connection acquisition, execution and admitted concurrency together so a slow provider cannot exhaust the service first.',
'Choose degradation from the operation. A stale catalog description may be permitted; a fabricated payment success is not. Separate critical and optional work, keep recovery/admin capacity, and avoid retry loops that overwhelm a recovering dependency. A breaker’s recovery probes must also fit the downstream budget.'
],
implementation:[
'Configure HTTP timeouts in the actual underlying client, and compose resilience libraries according to their scope. Retrying inside versus outside a circuit breaker changes observed attempts and load; applying a time limit without resource cancellation can leave hidden work. Test the configured composition rather than assuming annotations are interchangeable.',
'For remote business actions, persist intent and stable provider identity before relying on the result. Use conditional state transitions and a durable worker/workflow where needed. Spring local transactions, SQS dispatch and a managed orchestrator can implement parts of the protocol; none chooses the business policy for late success, expiry or an unavailable inquiry endpoint.'
],
worked:[
'Payment intent pay_7 is submitted; the provider accepts it and the response is lost. Retain UNKNOWN and reconcile the original identity through the supported provider contract. A second fresh key would create a different intention and can charge again. If retention or inquiry constraints prevent establishing the outcome, surface that limitation and route the unresolved case under business policy.',
'While recovery runs, release finite request resources and expose the durable state. Test crashes around intent creation, provider acceptance and result recording; repeat callbacks and race cancellation/expiry with late success. Recovery is proven by a known correct business outcome or a clearly owned unresolved state, not by the circuit breaker closing.'
],
pitfalls:[
'Failover and hedging can duplicate irreversible work if they create independent effects. Use them only under a protocol that preserves the required business identity and guarantee. Similarly, treating every HTTP 500 as retryable can amplify deterministic bugs or replay work whose result is unknown.',
'Observe useful completions, pending age, resource waits and recovery backlog alongside HTTP errors. A service can appear fast because it rejects everything or because it acknowledges work it never completes. Define the eligible population and success boundary so the reliability claim matches the customer journey.'
]
},
'deployment-runtime':{
problem:[
'A deployment is a transition through overlapping execution and data versions. For a period, old and new instances may both serve requests, consume events and write state. A green health endpoint proves little about whether an old reader can interpret a new status value.',
'Follow one order through a rollout and termination. The application must stop admitting work, finish or durably hand it off, and recover if termination becomes abrupt. Container packaging and orchestration make lifecycle controllable; they do not replace compatible contracts or crash-safe business protocols.'
],
requirements:[
'State what a successful release preserves: supported clients keep working, committed facts remain readable, accepted work survives interruption, and failure capacity stays within target. Define canary signals and rollback/forward-repair boundaries before enabling new writers.',
'Budget resources during overlap. Deployment surge can create more database connections and cold-cache fills than the ordinary replica count. A rollout losing one availability-zone share also differs from a healthy steady state. Capacity and compatibility are both release requirements.'
],
lifecycle:[
'Readiness controls eligibility for traffic; liveness asks whether restart is appropriate; startup handling gives initialization its intended conditions. A shared dependency outage does not automatically mean every process should be restarted. Choose probes that distinguish a stuck process from unavailable external capacity.',
'For shutdown, stop advertising readiness, allow routing state to propagate and drain bounded active work. New requests can arrive briefly while intermediaries update. A worker must finish a durable unit or let repeat-safe redelivery recover it, not acknowledge unfinished work. Graceful termination is an optimization over a crash-safe design, not permission to ignore crash windows.'
],
resources:[
'CPU and memory requests/limits influence scheduling and runtime behavior under the chosen platform. A Java heap is only part of process memory: native buffers, thread stacks and runtime metadata also consume resources. Choose headroom from representative measurements rather than setting heap equal to the container limit.',
'Capacity policies must consider startup, garbage collection, connection acquisition and dependency waits. More pods can remain pending without node capacity; more runnable pods can overload a shared database. Inspect useful completions and saturation rather than assuming a desired replica count has already become usable capacity.'
],
implementation:[
'Use explicit deployment configuration for readiness, shutdown grace, resource budgets and rollout strategy. In Spring, verify server and worker shutdown behavior for the actual runtime. HTTP draining does not automatically stop every scheduled task or safely transfer every consumer lease.',
'Apply expand/migrate/contract sequencing to schema and state changes: make readers compatible, migrate under a restartable protocol, enable new writes, and remove old behavior after the support/rollback window. Feature flags can control exposure, but disabling a flag does not erase new data already committed.'
],
worked:[
'Version B adds a payment state while A still serves reads. First deploy readers that understand or deliberately tolerate the future value. Then enable B’s writers for a controlled population and compare customer outcomes, errors and completion age. A probe that never reads the new state cannot validate this compatibility.',
'Interrupt the rollout and exercise rollback against data already written by B. If A cannot handle it, image rollback is not a safe recovery. Disable unsafe new writes if supported and use a compatible reader or forward repair. Also kill a worker after a local commit but before acknowledgement to prove interruption recovery remains correct.'
],
pitfalls:[
'A rollout can fail without a process crash: enum interpretation, default changes, incompatible serializers or a new scheduled job can break older instances. Test mixed versions and delayed messages, and identify every writer rather than only the web deployment.',
'A restart storm, synchronized cold fills or an oversized surge can turn a small problem into fleet-wide saturation. Keep a safe mitigation path, operational capacity and observable release identity. Declare success from the intended business journeys over an appropriate interval, not solely from all pods being Ready.'
]
},
'disaster-recovery':{
problem:[
'Replicas help some availability failures but can faithfully copy an accidental deletion. A backup supplies recoverable history; recovery must restore a usable business state. Keep recovery point objective (RPO: tolerated data-loss window) separate from recovery time objective (RTO: tolerated restoration duration).',
'The database is not the whole business world. A restored order ledger may be older than a completed provider payment, message delivery or shipment. Recovery therefore includes reconciling external facts and preventing unsafe replay, not only starting a database process in another region.'
],
requirements:[
'Define the service scope and failure scenario: instance loss, region loss, corruption and malicious/accidental change may need different recovery paths. State which facts may be lost, which customer journeys must become usable first and which operations must remain paused until reconciliation.',
'Include identities, keys/secrets, routing, capacity, dependencies, audit history and access controls. A backup is unusable if the required decryption key or identity path cannot be recovered. Measure RTO through the actual usable-service boundary and RPO against recoverable committed business facts.'
],
strategies:[
'Backup/restore, pilot-light, warm standby and active regional operation trade cost, readiness and coordination. Choose from tested requirements rather than ranking the most duplicated topology as automatically best. Extra live writers create ownership and conflict obligations that a standby design may avoid.',
'Failover includes proving the old writer cannot continue protected mutations, ensuring the new path has current-enough data and usable capacity, and directing clients under a controlled protocol. Failback is another migration with target-only facts to reconcile; it is not simply reversing a DNS record.'
],
backups:[
'Confirm what each backup contains, its consistency point, retention, encryption and restore prerequisites. A successful backup job is not a successful restore. Restore into isolation, start compatible application versions and verify critical identities and invariants using representative data.',
'Compare the restored point with external providers and retained message history. A provider charge after the restore point may need to reconstruct local state or trigger a governed recovery action. Replaying an older pending intent with a fresh provider identity can create a duplicate effect. Stable business references make reconciliation possible.'
],
implementation:[
'Automate reproducible infrastructure and configuration while keeping credentials and recovery access governed. Ensure the alternate environment can reach required identity providers, KMS keys, queues, object stores and external integrations. Dependency and quota readiness can dominate the recovery timeline.',
'Write a runbook with evidence gates: protect/fence old authority, restore/catch up, validate critical state, enable selected writes, reconcile the unresolved population and observe business outcomes. Each step needs an owner and a safe stop/repair condition. Exercise the procedure rather than assuming infrastructure-as-code proves recoverability.'
],
worked:[
'Restore the order ledger to 10:00 after failure at 10:05. Provider payment pay_7 completed at 10:03 and the restored ledger still shows pending. Before resuming irreversible work, match durable provider identity, available event history and order state. Decide the authority for each fact and record the reconciliation result.',
'Validate orders accepted near the boundary, duplicate/replayed events and already-completed shipments. Measure time until the required journeys are usable and the unresolved tail is governed. Retain evidence of observed loss, restoration duration and discrepancies so the next drill can test improvements rather than repeat assumptions.'
],
pitfalls:[
'An available secondary can still lack secrets, usable capacity, current data or compatible readers. A cross-region copy does not protect against every corruption history. Test the declared disaster scenario and the shared dependencies that may fail with it.',
'Prematurely enabling both writers can create conflicts while operators are trying to recover. Preserve ownership and distinguish safe read-only access from write readiness. Restoration success must include business reconciliation and failback planning, not just a healthy endpoint.'
]
},
observability:{
problem:[
'The order API returns acceptance, messaging handles later work, caches serve copies and payments can be unknown. A generic health check cannot explain which state a customer encountered. Observability connects emitted evidence to hypotheses about those states; it does not make the evidence a substitute for the authoritative ledger.',
'Begin with one question: why did a paid order not ship? Identify the expected transitions and the evidence needed to distinguish publication failure, consumer failure and a remote unknown outcome. Add signals for those decisions rather than collecting every possible field without a question or retention policy.'
],
requirements:[
'Define detection and investigation separately. Aggregate indicators should reveal customer-impacting delay or failure, while controlled identities let an operator investigate one journey. Specify retention, sampling, redaction and audit integrity according to purpose. A sampled trace cannot be the only record needed for business recovery.',
'Measure acceptance and completion over explicit eligible populations and deadlines. Pending work must not disappear from the indicator merely because it has not finished. Also observe the telemetry pipeline itself: exporter failures or dropped data can make an unhealthy service look quiet.'
],
signals:[
'Metrics summarize measurements over bounded dimensions; logs describe events; traces relate timed execution through propagated context. Profiles can show where runtime resources are spent. A durable order/event ledger records facts required for correctness. Choose the signal that can establish the required evidence, and connect them with appropriately scoped identifiers.',
'For latency, align boundaries before comparing values: gateway time, local queue wait, handler execution and provider work can measure different intervals. Aggregate compatible histograms/distributions instead of averaging pod percentiles. Use bounded route/failure/version cohorts to expose skew without creating an unbounded metric series for every customer.'
],
identity:[
'An order ID identifies a durable entity; an operation key recognizes one intended mutation; an event ID recognizes one fact; an attempt ID distinguishes one execution; a trace context connects recorded spans. A retry can have another trace while retaining the same business identity. Treating these as one identifier makes both diagnosis and duplicate protection ambiguous.',
'Propagate trace context across supported HTTP/message carriers and validate untrusted incoming metadata. Keep durable business references where recovery needs them even when traces expire. Context is not authority: a caller-supplied trace ID cannot grant access, prove a committed effect or dictate unlimited sampling cost.'
],
'java-context':[
'Logging context such as MDC is commonly associated with execution threads. An executor handoff, reactive pipeline or message boundary may lose it unless the supported framework/instrumentation captures and restores context. Cleanup matters too: reused threads must not retain another request’s identity.',
'ScopedValue provides scoped in-process value access under its runtime rules; it does not create spans, inject HTTP headers or decide sampling. Use instrumentation suited to the actual stack and verify propagation through custom executors and manually constructed clients. Business identity remains separate from logging convenience.'
],
metrics:[
'Start with a precise numerator, denominator and measurement window. An acceptance SLI might count eligible valid requests durably accepted within a deadline. A completion SLI might count accepted orders reaching fulfillment within their target age. These populations differ; HTTP success alone can hide a broken asynchronous flow.',
'Choose bounded labels such as route template, operation class, release or controlled error category. Order IDs and raw URLs can create unbounded cardinality. Preserve essential audit/ledger facts separately when sampling or telemetry retention would discard individual execution details.'
],
implementation:[
'Instrument inbound and outbound boundaries using configured Spring/Micrometer/OpenTelemetry support appropriate to the stack. Check custom HTTP clients, message attributes, executor handoffs and exporter failure behavior. Seeing one local span does not prove end-to-end propagation.',
'On AWS, map the complete collection/export path and its trust/retention rules. Telemetry is workload and cost too: bound payloads, redact credentials and avoid putting sensitive data in baggage that travels to unrelated services. Core business metrics and recovery records should not depend on every trace being retained.'
],
worked:[
'For an accepted paid order, inspect the durable order state, its outbox event, relay evidence, consumer receipt/quarantine and fulfillment task. If the consumer rejected an unsupported schema, a healthy broker delivery graph does not mean shipping completed. The missing state transition explains the customer impact.',
'Repair the reader compatibly and replay under the original event identity with conditional/repeat-safe effects. Confirm the final fulfillment state and audit the recovery action. A trace may speed the investigation, but the procedure must still work when that trace was sampled out or expired.'
],
alerts:[
'Alert on actionable customer symptoms and risk to a defined SLO, with a responsible owner and diagnostic path. Queue depth alone can fall because events moved to quarantine; CPU can be low while the database pool is exhausted. Combine outcome/age signals with evidence useful for the likely causes.',
'Error-budget burn compares observed bad-event consumption with the allowed budget over the selected window. Use appropriate short and long perspectives to distinguish sudden and sustained problems. Recovery proof needs restored business outcomes, not merely an alert returning green after its data pipeline failed.'
]
}
};
const followups={
reliability:[['Intermediate','Why can a shorter timeout still leave the service exhausted?','The caller may stop waiting while underlying network/task work continues to hold resources. Verify cancellation and cleanup, bound admitted concurrency and pool waits, and preserve recovery for already-accepted remote effects.'],['Advanced','Can recovery continue after the HTTP deadline?','Yes, through a durable intent and separately bounded recovery policy. The response deadline limits the caller wait; it must not erase the identity and evidence needed to resolve a possible committed effect.']],
'deployment-runtime':[['Intermediate','Why is image rollback not necessarily safe?','The newer version may have committed states or representations that old readers cannot interpret. Verify mixed-version/data compatibility and retain a forward-repair route; changing the binary does not reverse those facts.'],['Advanced','What must a shutdown test include?','Late routed requests, bounded drain, forced termination after grace, worker commit/ack gaps and repeat-safe reclamation. Graceful shutdown should improve behavior while abrupt interruption remains recoverable.']],
'disaster-recovery':[['Intermediate','What does a successful restore fail to prove?','That the application and dependencies work, keys/secrets are usable, acknowledged business facts meet RPO, and external effects reconcile. Measure the entire required recovery journey.'],['Advanced','Why can replay after restore create another payment?','The restored local state may predate a provider completion. Replaying with a fresh identity discards the connection to the existing effect. Reconcile original provider references before issuing another action.']],
observability:[['Intermediate','Why can all HTTP requests succeed while the business SLO fails?','Acceptance may be prompt while asynchronous completion is delayed or stranded. Define and measure completion over accepted operations with explicit deadlines and pending-state handling.'],['Advanced','How do you investigate when the trace is missing?','Follow durable business, operation and event identities through authoritative state, outbox/inbox and controlled outcome/audit records. Traces are sampled execution evidence, not the only recovery ledger.']]
};
export function deepenOperations(lessons){for(const [slug,sections] of Object.entries(content)){const l=lessons.find(x=>x.slug===slug);if(!l)throw Error(`Missing ${slug}`);for(const [id,paras] of Object.entries(sections)){const t=l.sections.find(s=>s.id===id);if(!t)throw Error(`Missing ${slug}/${id}`);let rest=t.html.replace(/^(?:<p>[\s\S]*?<\/p>)+/,'');for(const verification of t.html.match(/<p>(?:Test |Validate )[\s\S]*?<\/p>/g)||[])if(!rest.includes(verification))rest+=verification;t.html=paras.map(p).join('')+rest;}l.sections.find(s=>s.id==='interview').html+=qa(followups[slug]);}}
