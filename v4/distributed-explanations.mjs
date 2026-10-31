import {p,qa} from './lesson-helpers.mjs';
const content={
consistency:{
problem:[
'The order transaction committed, but a status read from another copy says not found. Keep the write outcome and the read observation separate: the writer may be correct and the replica delayed. The missing agreement is which observation the caller was promised after acceptance. Read-your-writes is a user-journey guarantee, not something implied by the existence of replicas.',
'Now let inventory and payment belong to independent services. A fresh inventory read does not make both services commit together. Reader freshness and multi-resource atomicity are different dimensions. We will first specify permitted observations, then explain coordination and the intermediate states it must recover.'
],
requirements:[
'Choose guarantees per operation. Browsing and analytics may tolerate delayed copies; authorizing a financial transition may require authoritative current state. A customer’s immediate post-create lookup can need read-your-writes without requiring every reader worldwide to observe one real-time order. State the boundary rather than saying all data must be “strongly consistent.”',
'Also define what a write acknowledgement means under the store/topology and which failures the contract covers. A local durable commit, replicated acknowledgement and completion of a remote workflow are not interchangeable. Under lost communication, describe whether an operation waits, rejects, accepts pending work or permits a domain-defined conflict.'
],
models:[
'A consistency model describes which histories of observations are allowed. Linearizability makes the specified operations appear to take effect at points between invocation and response while respecting completed real-time order. Read-your-writes promises a caller visibility of its own completed writes. Causal guarantees preserve causal relationships, while unrelated concurrent changes still need a conflict policy.',
'Eventual convergence alone gives no maximum staleness interval. Serializable transaction isolation is about equivalence to a serial execution, not automatically real-time ordering across clients. Apply these names to the actual operation and system boundary; a correct guarantee for one key or transaction cannot silently be extended to an entire multi-service purchase.'
],
partitions:[
'A network partition means some participants cannot communicate even though they may still be running. If a rule needs one authoritative order of conflicting writes, isolated groups cannot independently invent that same order without additional coordination assumptions. The system may need to reject/wait for some work or explicitly permit reconcilable conflicts.',
'A quorum supplies an overlap argument under a membership and protocol model. The inequality R+W>N is not a complete correctness proof: concurrent writers, versions, failures and reconciliation determine what the reader can actually observe. Likewise, electing a replacement leader does not stop an old paused process from acting. Protected resources must reject obsolete authority through an enforced ownership/fencing protocol.'
],
coordination:[
'Prefer one local commit boundary when it naturally owns the invariant. Independent services may instead need atomic coordination supported by their participants, or a workflow allowing visible partial progress. A saga coordinates local steps and recovery actions; it does not turn them into an invisible ACID transaction.',
'Compensation is a new business action after an earlier commit. A refund may be delayed or fail; a reservation may already be reassigned; an email cannot be unread. Record progress and identities durably, define meaningful recovery for irreversible steps, and do not choose a saga when the required invariant cannot tolerate its intermediate states.'
],
implementation:[
'Write a durable state machine before selecting an orchestrator. Record the order, current step, stable command/provider identity, state version and unresolved outcome. A conditional transition prevents two workers independently deciding incompatible next states. Recovery must resume from those facts instead of restarting the purchase with fresh identities.',
'Spring transactions protect configured resources, while an ordinary provider call remains another authority. A database-backed coordinator or a managed workflow can run the protocol, but retry settings do not choose the business recovery rule. Event choreography still needs ownership, deadlines and an inspectable explanation of overall progress. Verify exact consistency behavior for the chosen table, index and regional topology.'
],
worked:[
'Follow a reservation racing expiry while payment is in flight. If confirmation wins the authoritative RESERVED transition, expiry must not release that same reservation. If expiry wins, a late payment success cannot simply overwrite the state and promise fulfillment. Resolve it through the declared re-reserve, void or refund policy.',
'Keep UNKNOWN separate from DECLINED. Before compensation or another irreversible attempt, reconcile the original provider operation. Test duplicated callbacks, stale coordinators, repeated expiry and provider failure during recovery. The customer-visible pending state and operator-owned unresolved tail are part of the design, not exceptional details outside it.'
],
pitfalls:[
'Stale observations become dangerous when used to authorize mutations. A delayed display can be acceptable while a second charge based on that display is forbidden. Separate the source used for a view from the authority used for the decision and state their freshness explicitly.',
'When comparing alternatives, identify the invariant owner, coordination participants, availability/latency cost and recovery burden. A named consistency model or workflow product is not evidence that every boundary is protected. Introduce a partition and one crash at each commit point to test the argument.'
]
},
microservices:{
problem:[
'The application now has orders, inventory, payment and fulfillment behavior. Those names do not require four deployable services. Start with who owns each rule, which facts change together and which team needs independent change. A module can create a useful boundary without adding a network or separate deployment.',
'Extracting a module changes failure semantics. A method call becomes remote admission, serialization, communication and an uncertain response. If an inventory reservation was formerly part of the order transaction, extraction introduces a visible interval and recovery protocol. The service boundary must justify that cost through ownership, scaling or deployment needs.'
],
requirements:[
'Collect change patterns as well as request rates. Which features repeatedly modify the same business rules? Which operations must commit atomically? Which team can operate and evolve the behavior independently? Those answers often reveal a more coherent boundary than a table-by-table split.',
'Include operating constraints: on-call ownership, contract evolution, identity, telemetry and data migration. Independent deployment is useful only when the team can preserve compatibility and diagnose failures across the new boundary. A diagram with many small boxes can conceal tightly synchronized releases and a shared database that nobody owns.'
],
model:[
'A bounded context supplies a consistent domain model and vocabulary. The word customer may mean a payer in billing and a delivery recipient in fulfillment; forcing one universal entity can couple unrelated changes. Define the facts each context owns and the interfaces through which others learn or request changes.',
'In a modular monolith, enforce module interfaces and data access discipline before distributing execution. Private data ownership makes later extraction safer. If every module can mutate every table, adding REST endpoints does not create independent domain ownership. Keep business invariants cohesive even when the storage representation spans several tables.'
],
communication:[
'Follow one customer journey across proposed services and count sequential dependencies. Every required synchronous response contributes latency and availability constraints. A call from orders to inventory may be justified for reservation, while email or analytics may use durable asynchronous progress. Choose from completion semantics rather than a blanket “everything is an event” rule.',
'An event records a fact owned by its source, not permission for any consumer to rewrite that source’s data. A command has a responsible action owner. Publish stable domain contracts rather than leaking internal table schemas without an evolution policy. Consumers needing local views must own their freshness, backfill and replay behavior.'
],
implementation:[
'Place an application interface around a cohesive module, test its contract and identify its data authority. Then extract a bounded path if independent operation is needed. Spring controllers and messaging listeners adapt transport; they should call explicit domain/application boundaries rather than exposing repository methods as the public service contract.',
'For AWS/EKS deployment, separate scaling and identity policies by the actual service responsibility, and propagate evidence across calls/events. Network access is not domain authorization. Each new service needs bounded dependencies, rollout compatibility and a recovery runbook. Sharing a library can reduce boilerplate, but shared domain schemas can also force lockstep upgrades.'
],
worked:[
'Extract fulfillment first when delayed shipping work can proceed independently of order acceptance. Commit an order-side event durably; fulfillment creates its own task and uses a stable warehouse identity. Orders exposes progress under the agreed contract without directly mutating fulfillment tables.',
'If inventory is extracted later, model reservation, expiry and late payment before cutover. Migrate write ownership deliberately and avoid two active authorities for the same stock. Compare the extra intermediate states with the organizational/scaling benefit. It is reasonable to retain a cohesive local boundary where distribution does not solve a measured problem.'
],
pitfalls:[
'A distributed monolith has network-separated processes that still require coordinated releases or chatty shared-state access for ordinary work. Diagnose change coupling and critical-path fan-out rather than counting services. A shared database can be a migration stage, but independent uncontrolled writers undermine the claimed boundary.',
'Review failure and cost after extraction. More telemetry, deployments, contracts and on-call paths are real obligations. Keep rollback compatible with data already produced by the new service, and retire old jobs/routes only when no supported path depends on them.'
]
},
'rate-limiting':{
problem:[
'Scalability showed that finite dependencies can be overwhelmed before new capacity arrives. Rate limiting decides which arrivals may enter under a policy; backpressure/admission control align accepted work with processing capacity. Protecting a service therefore involves both usage allocation and overload behavior.',
'Keep rate, quota and concurrency separate. A rate bounds arrivals over time, a quota bounds accumulated use over an allocation period, and concurrency bounds active work. Fifty requests per second can be safe at 100 ms and exhausting at two seconds. A fixed rate policy alone does not bound the latter wait population.'
],
requirements:[
'Define who shares capacity: user, tenant, credential, endpoint or service. A global limit can be monopolized by one tenant; independent tenant limits can collectively exceed total capacity. Combine allocation with a global resource budget and decide how bursts and priorities are handled.',
'State the response and recovery contract. Rejected work must not secretly commit a business effect. Deferred work needs durable acceptance and an age/deadline policy. A Retry-After hint should be compatible with the client’s overall deadline; it is not permission for synchronized unlimited retries.'
],
algorithms:[
'A token bucket accumulates permits up to a capacity and replenishes them at a rate. It permits bounded bursts after idle time while constraining sustained admission. A fixed window is simple but can admit bursts at adjacent boundaries; a sliding approach smooths that behavior at additional state/coordination cost.',
'Choose the unit carefully. Requests with radically different cost should not always consume identical permits. Consider payload/query work and downstream resources. A concurrency semaphore protects active work, while a bounded queue absorbs some waiting. Specify acquisition timeout, release behavior and cancellation so an abandoned request does not leak a permit.'
],
distributed:[
'With several application instances, independent local counters can admit several times a purported global limit. A shared atomic counter/script can coordinate a chosen scope but adds latency and an availability dependency. Hierarchical or approximate local budgets trade precision for reduced coordination; expose that trade-off instead of calling it an exact global guarantee.',
'Choose failure behavior by operation. Failing open can preserve availability while losing abuse/resource protection; failing closed can block legitimate work during a limiter outage. Keep sensitive invariants elsewhere at their authority. Clock, expiry, hot-key load and retry races need testing in the actual shared-state implementation.'
],
implementation:[
'At the edge, apply coarse body/rate controls to avoid spending application resources on obviously excessive traffic. In the application, enforce tenant/resource-aware admission and bound costly downstream concurrency. Gateway throttling and WAF rules do not automatically provide fair scheduling inside a shared worker or database pool.',
'Spring can integrate limiter and bulkhead libraries, and Redis can support selected shared algorithms, but configure the scope and failure policy explicitly. Measure attempted, admitted, rejected and completed work separately. Keep counters bounded and avoid a distinct metric time series for every unbounded identity.'
],
worked:[
'For a flash sale, reserve capacity for checkout and bound catalog refill separately. Give tenants a declared allocation and cap total database-facing work. When processing slows, the concurrency gate prevents indefinite accumulation even if arrival rate remains within its ordinary limit.',
'Test a burst at a window boundary, one noisy tenant, shared-limiter failure and a dependency slowdown. Verify rejected requests cause no business mutation, accepted durable work remains recoverable, and retry guidance does not amplify overload. Measure queue age and useful completions rather than celebrating a low rejection percentage alone.'
],
pitfalls:[
'An unbounded queue can make acceptance look successful while deadlines become impossible. Recalculate backlog drain using completion capacity minus new arrivals; if there is no positive margin, waiting will not resolve itself. Reject/defer according to the contract before accepting work without a viable completion path.',
'Fairness is a business and scheduling choice, not just a counter. Separate limits, priorities and queues can help, but starvation and bypass paths still need analysis. Protect administrative/recovery capacity so an incident does not prevent the operations required to repair it.'
]
},
'replication-partitioning':{
problem:[
'The database lesson introduced additional copies for reads and partitions for distribution. Now make ownership explicit. A replica maintains a copy of logical data; a partition owns a subset of data/work. Neither mechanism removes the need to coordinate conflicting decisions or recover from an old owner returning.',
'Follow an order write, a replica read and a failover separately. The write’s acknowledgement policy determines known durability; replication mode affects what a reader may see; failover chooses who may accept later writes. A product offering “replication” does not answer all three questions without its configuration and protocol.'
],
requirements:[
'Define read freshness, acknowledged-write survival and recovery-time expectations per operation. A dashboard can tolerate lag that is unacceptable for a new order lookup. A low data-loss objective may impose coordination or replication costs that differ from a best-effort browse view.',
'For partitioning, record query locality, cross-key invariants, data size and real key popularity. Tenant count alone does not predict load balance. Plan rebalancing and failure capacity before the dataset or workload outgrows one owner.'
],
replicas:[
'In asynchronous replication, the writer can acknowledge before a follower applies the change. Routing a fresh post-write lookup to that follower can produce stale absence. Synchronous acknowledgement can strengthen selected durability/visibility properties but increases coordination and needs a precise failure policy.',
'During failover, distinguish choosing a new leader from preventing obsolete writes. The old process may be paused or isolated rather than dead. Terms, epochs or fencing must be enforced at the protected resource. A coordinator’s lease expiry is not a physical stop signal to code still running elsewhere.'
],
keys:[
'A partition key determines where work is routed. A tenant key makes many tenant queries local, yet one large tenant may dominate a partition. Splitting by time or another bucket can distribute work while requiring fan-out, aggregation or additional projections. Evaluate the busiest keys, not just average partition utilization.',
'A single coordinated inventory claim may remain hot regardless of partition count. Splitting its authority changes the business protocol, such as allocating bounded stock to separate owners. Consistent hashing can reduce movement under membership changes, but does not by itself solve skew, replication, write ownership or the semantics of concurrent rebalancing.'
],
migration:[
'Rebalancing moves ownership while traffic continues. Establish a source baseline plus subsequent changes, route reads/writes under a controlled protocol and fence obsolete writers at cutover. A copied dataset that looks complete at one instant can still lose updates made during transfer.',
'Verify critical identities, versions and invariants, and define rollback after new-owner writes begin. Pointing clients back is insufficient if the old owner lacks committed target facts. Budget the load of copy, catch-up and repair so movement does not overload the system it is meant to expand.'
],
worked:[
'Partition order history by a key matching its access pattern and keep the live inventory authority separate where its invariant requires coordination. Use replicas only for operations whose freshness contract permits the selected path. Track hot partitions and lag alongside aggregate throughput.',
'Exercise leader loss, a paused old leader returning, lagging reads and migration during writes. Confirm that acknowledged facts survive under the declared policy and obsolete authority cannot commit protected effects. A successful routing change is not proof of data reconciliation or safe write ownership.'
],
pitfalls:[
'Redundancy is not backup: an accidental delete or corrupt write can replicate successfully. Retain independent recoverable history and rehearse restore/reconciliation. Also test failure-domain concentration; copies sharing one dependency may fail together.',
'Large aggregate capacity can hide a hot key, lagging follower or exhausted failover target. Make ownership, skew and lag observable. More shards or replicas are useful only when they address the measured operation without weakening its required guarantees.'
]
}
};
const followups={
consistency:[['Intermediate','Does a fresh read make checkout across two services atomic?','No. Freshness constrains an observation, while atomic commitment constrains a set of changes. Identify the authorities and commit protocol; independent local commits require explicit intermediate states and recovery.'],['Advanced','Why can payment succeed after a reservation expires?','The remote operation and expiry have independent timing/commit boundaries. Conditional reservation transitions establish the winning local state; reconcile the original payment identity and apply the declared re-reserve, void or refund policy.']],
microservices:[['Intermediate','Why can splitting by tables create a distributed monolith?','One business rule can require several tables and atomic decisions. Splitting them into separate owners without changing the protocol creates chatty coordination and lockstep releases rather than coherent autonomy.'],['Advanced','What should an extraction prove before routing all traffic?','Clear write ownership, compatible contracts/data, recovery for new remote boundaries, acceptable critical-path capacity/latency and an operating owner. Test cutover and rollback with facts already committed by the new path.']],
'rate-limiting':[['Intermediate','Why can a service overload while requests stay below its rate limit?','Service time can increase, so the same arrival rate produces more simultaneous work. Bound active work and waiting at scarce dependencies separately from rate/quota allocation.'],['Advanced','How do you combine tenant fairness with total capacity?','Allocate tenant-aware budgets while enforcing a global resource/concurrency budget. Independent local or per-tenant limits alone can collectively exceed capacity; a global limit alone can be monopolized. State precision and limiter-outage policies.']],
'replication-partitioning':[['Intermediate','Why does another replica not automatically fix stale post-create reads?','The selected replica may not have applied the acknowledged write. Define read-your-writes and route/use a protocol that supplies it for that journey; do not infer freshness from replica count.'],['Advanced','What prevents an old leader from writing after failover?','An enforced ownership/fencing protocol at the protected resource, using terms/epochs or equivalent authority checks. Election or lease expiry elsewhere does not physically stop a paused process from returning.']]
};
export function deepenDistributedDecisions(lessons){for(const [slug,sections] of Object.entries(content)){const l=lessons.find(x=>x.slug===slug);if(!l)throw Error(`Missing ${slug}`);for(const [id,paras] of Object.entries(sections)){const target=l.sections.find(s=>s.id===id);if(!target)throw Error(`Missing ${slug}/${id}`);target.html=paras.map(p).join('')+target.html.replace(/^(?:<p>[\s\S]*?<\/p>)+/,'');}l.sections.find(s=>s.id==='interview').html+=qa(followups[slug]);}}
