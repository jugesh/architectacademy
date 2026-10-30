import {p,section,qa} from './lesson-helpers.mjs';
// Authored explanations: do not infer teaching text from section headings.
const paths={
networking:[
'Follow the time, not just the URL',
'You know that an API receives an HTTP request. Before its controller can run, the caller must find a destination and establish a usable connection. DNS translates a name into an address; a connection joins endpoints; TLS authenticates the peer and protects traffic; HTTP describes the operation. These layers have separate state and separate failure signals. A successful DNS lookup therefore proves neither that a port is reachable nor that the certificate is trusted.',
'Consider an order lookup taking two seconds although its controller timer records 30 ms. First ask what that timer excludes. The client may have waited for a pooled connection, performed DNS resolution, negotiated TLS, or waited at a proxy before the controller began. Reusing a connection avoids some setup work, but does not make its lifetime unlimited. Idle connections can be closed by either endpoint or an intermediary. Diagnose the stage before changing the read timeout.',
'An HTTP timeout means the server did not execute the operation.',
'No. The response can disappear after the database commits. Connection failure before sending and timeout after sending convey different evidence, and even client instrumentation may not establish the remote outcome. Use business identity and reconciliation for a mutating operation.',
'Why can a connection pool be exhausted while CPU is idle?',
'Connections remain occupied while requests wait on downstream work. Inspect lease wait, active connections and remote latency. More CPU cannot release those connections; bound waits and concurrency before increasing the pool.'
],
security:[
'Follow identity into one authorization decision',
'Begin with GET /orders/42. A credential answers who the caller is or which client is acting. That still leaves a separate question: may that caller read order 42? Authorization is the decision over subject, action, resource and context. A role such as customer is insufficient if it grants access to every customer order. Tenant membership and resource ownership are part of the decision.',
'Walk through the checks in order. Validate a token using an explicitly trusted issuer and expected audience; check its time validity and permitted algorithm through the security library. Establish the subject. Query the order within the authorized tenant or verify ownership before returning it. Shape the response so forbidden fields are absent. Repeat equivalent checks for updates, background jobs and exports. An authenticated internal request is not a universal exemption.',
'A signed JWT makes its claims safe to use for any API.',
'A valid signature only establishes integrity under a key. The receiving service must also establish trust in issuer, intended audience and claim semantics. A token intended for another service may be correctly signed and still unacceptable here.',
'Where should tenant isolation be enforced?',
'At every authoritative data access or mutation boundary. Derive the tenant from trusted security context and authorized delegation, then constrain queries and writes. UI filtering and a tenant header chosen freely by the caller are insufficient.'
],
scalability:[
'Account for where one request spends time',
'A service is a collection of finite resources. CPU executes instructions, connections carry requests, memory holds active work, and storage serves reads and writes. Throughput is completed work per unit time. Latency includes execution and waiting. Increasing one resource helps only when it limits the operation or removes work from the limiting resource.',
'At 100 requests per second and 0.2 seconds average time in the measured system, about 20 requests are present on average in steady state. If a dependency slows to one second at the same admitted arrival rate, that becomes about 100. Those requests occupy memory and connections even if CPU is quiet. Once a limit is reached, waiting grows further. This feedback explains why replicas, bounded queues and admission control must be considered together.',
'Doubling replicas doubles capacity.',
'Only when the divided work and shared dependencies allow it. Two application replicas can contend on the same database lock or overwhelm the same connection limit. Measure useful throughput and tail latency after each change.',
'Why might autoscaling make a database incident worse?',
'Each new replica can open more database connections and add retries. If the database is already the constraint, scaling callers increases pressure. Cap fleet-wide concurrency and preserve headroom before scaling.'
],
databases:[
'Derive correctness before choosing a storage product',
'A database stores committed facts, but the application decides which combinations of facts are legal. An invariant is a rule that must remain true after every allowed transition. A constraint checks a rule in the database. A transaction groups changes into one commit. Isolation determines which concurrent observations and outcomes are permitted. These terms solve related but different parts of correctness.',
'Two buyers see stock=1. If both make a decision in Java and later write stock=0, two orders can exist for one item. Begin with one atomic conditional update that subtracts only when enough stock remains. Inspect affected-row count and insert the reservation in the same local transaction. The business decision now happens where competing mutations are coordinated. An index can accelerate access to that row; it cannot replace the rule.',
'Wrapping check-then-write in a transaction always prevents overselling.',
'Not at every isolation level and not for every read/write pattern. Use an appropriate conditional mutation, lock or serializable protocol, account for conflicts and retry the entire required transaction with stable operation identity.',
'Why is a replica a poor default for a post-create lookup?',
'An asynchronous replica can lag behind the committed writer. The absence is then stale evidence, not proof creation failed. Choose the read path according to the promised freshness and use the original identity on retries.'
],
caching:[
'Derive freshness from the operation',
'An index finds the authoritative row faster; a cache answers from a separate copy. That distinction introduces time into correctness. A TTL limits how long an entry is reusable under a policy. Eviction removes an entry for capacity or policy reasons. Invalidation reacts to a change. None of those words alone specifies how stale the answer can become during concurrent fills or failed updates.',
'Follow a race. A reader loads product version 7. A writer commits version 8 and deletes the cached entry. The earlier reader then stores version 7 after that deletion. The cache is stale despite invalidation. Depending on the freshness contract, use a bounded expiry, version-aware updates or a coordinated strategy. For checkout, revalidate the price against an authoritative rule instead of assuming a cached browse price is a purchase guarantee.',
'A high hit ratio means the cache is working correctly.',
'It measures reuse, not freshness, tenant isolation or total cost. Observe stale-answer incidents, source load during misses, refill concurrency, eviction and key distribution alongside hit ratio.',
'What must happen when Redis becomes unavailable?',
'The policy depends on the operation. Browsing may use bounded stale data or constrained database fallback. An authoritative safety rule must not silently disappear. Limit fallback concurrency so a cache outage does not become a database outage.'
],
messaging:[
'Identify exactly what an acknowledgement proves',
'An asynchronous message represents work or a fact that another process can handle later. Delivery means the broker made it available to a consumer. Processing means the consumer attempted its handler. Completion means the intended business effect reached its defined durable boundary. An acknowledgement tells the broker when it may stop redelivering; it is not automatically evidence that a remote shipment or payment completed.',
'Commit an order and an outbox row together. A relay publishes the row, then records publication. If it crashes between those steps, it may publish again. A consumer can record the event ID and its local mutation together so a repeat does not apply that mutation twice. If it calls an external carrier, a second boundary remains: the carrier may act before the consumer records success. Carry stable provider identity and reconcile that uncertainty.',
'Exactly-once delivery eliminates duplicate business effects everywhere.',
'A guarantee has a scope. Broker transactions do not automatically include an external database or provider. Identify which resources participate, how retries are recognized, and what evidence survives a crash.',
'When should a consumer acknowledge?',
'After the durable work required by its processing contract commits, with explicit recovery for remote effects. Acknowledging before durable handoff risks loss; acknowledging after a crash can lead to redelivery, which must be safe.'
],
consistency:[
'Separate fresh reads from atomic workflows',
'Consistency describes the observations and histories an operation permits. Transaction atomicity describes whether grouped changes commit together. You can atomically commit an order on the writer and still read an older value from a replica. Conversely, a fresh single-row read does not make a multi-service checkout atomic. State which property the user journey actually needs.',
'A customer pays and immediately opens order status. A stale view may briefly say pending, which could be acceptable if documented. Using that stale view to start another charge is a different decision with a stricter correctness requirement. Keep the authoritative payment transition in a controlled write path. Use a read model for display only when its delay does not authorize an unsafe action.',
'A saga is an ACID transaction spread over services.',
'A saga coordinates local commits and recovery actions. Intermediate states are visible and compensation can fail or be semantically incomplete. It requires durable progress, repeatable steps and reconciliation.',
'Can a refund compensate every payment failure?',
'No. Refunds can fail, take time, incur fees or be forbidden in a particular state. Model irreversible effects and business recovery explicitly rather than treating compensation as a mathematical inverse.'
],
microservices:[
'Find an ownership boundary before adding a network call',
'A module groups behavior behind an interface. A service adds independent process, deployment and operational boundaries. A bounded context supplies a consistent domain model and vocabulary. Those boundaries can align, but they are not identical. First ask which team owns a rule and which facts it must change atomically.',
'Orders and inventory may begin as modules sharing a local transaction. Extracting inventory creates an interval between accepting an order and confirming a reservation. The API must now represent that interval and recover when the reservation response is lost. If the product cannot tolerate the intermediate state, splitting processes requires more coordination or a revised boundary. Network separation does not erase the original invariant.',
'Each database table should become a service.',
'A table is a storage detail. Splitting by tables can force every business operation into chatty distributed coordination. Group by domain responsibility, change patterns, invariants and team ownership.',
'When is a modular monolith a reasonable endpoint?',
'When coherent modules, acceptable release coupling and one operational unit meet the workload and team needs. Extraction should solve a measured ownership, scaling or deployment problem with a sustainable operational cost.'
],
'rate-limiting':[
'Distinguish arrivals from work already in progress',
'A rate limit bounds arrivals over time. A quota bounds total usage over a longer allocation period. A concurrency limit bounds active work. If requests become slower, an unchanged arrival rate can still produce too much simultaneous work. This is why a request-per-second rule is only one part of overload control.',
'Suppose 50 requests arrive each second and complete in 100 ms: average in-flight work is about five. A dependency slowdown to two seconds raises that figure toward 100 under steady admitted traffic. A concurrency gate can reject or defer work before the scarce pool is exhausted. A bounded queue absorbs a short burst but cannot sustainably absorb arrivals above service capacity.',
'A queue solves overload without rejecting callers.',
'Only for bursts or work whose demand can eventually be served within its deadline. Sustained excess arrivals grow backlog, delay and cost. Bound queue capacity or age and define admission, expiry and recovery policies.',
'How do you protect small tenants from a large tenant?',
'Combine tenant-aware allocation with global capacity limits and bounded concurrent work. A global counter alone can be monopolized; independent per-tenant limits alone can exceed total capacity.'
],
'replication-partitioning':[
'Ask whether you need another copy or another owner',
'Replication makes copies of a logical dataset. Partitioning assigns subsets to different storage or execution owners. Copies can improve failure tolerance or read distribution; partitions can distribute capacity. Both introduce coordination. The routing key determines locality, while the distribution of real keys determines whether load is balanced.',
'Partition orders by tenant. Most queries stay local, but one merchant generates half the traffic. Adding partitions for other tenants does little for that merchant. Splitting it by time or an additional bucket distributes work while making some reads fan out. During rebalancing, establish which owner may accept writes and how old owners are fenced. Routing changes without ownership control can create conflicting writers.',
'A replacement leader is safe because the old one is unreachable.',
'Unreachable to the coordinator does not mean stopped. The old process may still reach storage or clients. Use an ownership protocol and fencing token or storage mechanism that rejects obsolete authority.',
'Why can a good average partition load hide an incident?',
'One hot key can dominate tail latency while most partitions are idle. Measure skew, busiest partitions and per-key classes, then choose a split that the workload can actually use.'
],
reliability:[
'Follow an unknown outcome through recovery',
'A timeout bounds waiting; it does not roll back a remote operation. A retry makes another attempt; it does not prove that repeating is safe. A circuit breaker limits calls to a failing dependency; a bulkhead isolates capacity. Learn these responsibilities separately before composing them.',
'Capture payment with operation ID pay_7. The provider acts, but the response is lost. Store or retain an UNKNOWN state and look up pay_7 using the provider contract. If another attempt is allowed, reuse that identity within the provider retention rules. Never create a fresh operation merely because a socket timed out. Meanwhile release local resources according to deadlines; recovery must survive beyond that HTTP request.',
'Every failure should trigger three retries.',
'Only transient failures with safe repetition and remaining time/load budget should be retried. Layered retries multiply traffic. Validation errors, exhausted deadlines and ambiguous unsafe writes need different policies.',
'Why is a circuit breaker insufficient for a slow database?',
'Calls already in progress can consume the pool before it opens. Bound connection acquisition, statement execution and admitted concurrency. Measure cancellation behavior and lock/transaction cleanup.'
],
'deployment-runtime':[
'Treat a rollout as overlapping versions',
'A container packages a process; a deployment controller manages its lifecycle. During a rolling update, old and new versions often coexist. Readiness determines eligibility for traffic. Liveness decides when restarting may help. Graceful shutdown coordinates stopping new work and finishing or handing off existing work. None replaces application compatibility.',
'Version B writes a new order status while A is still serving reads. If A rejects that status, the rollout fails even when every health probe is green. First deploy readers that tolerate the future state, then enable writers, and only later remove old behavior. For shutdown, remove readiness, account for routing propagation and drain active work within the platform grace period.',
'Rolling back an image rolls back the data.',
'Committed schema and business-state changes survive an image change. Define rollback compatibility and a forward-repair route for writes old code cannot understand.',
'Should liveness fail whenever a dependency is down?',
'Usually that creates restart storms without repairing the dependency. Distinguish a stuck process from temporary downstream unavailability; readiness and admission policies require their own capacity analysis.'
],
'disaster-recovery':[
'Define recovery in business terms',
'A backup is a recoverable representation of data at some point. RPO is the tolerated data-loss window; RTO is the tolerated recovery duration. A replica can copy accidental corruption, so redundancy and recovery are distinct. A successful restore must recover a usable business state, not merely a running database.',
'Restore an order database to 10:00 after an incident at 10:05. A payment completed at 10:03 in an external provider may now have no matching local order transition. Before resuming charges, compare provider identities, outbox/inbox state and ledger records. Decide the authoritative source for each fact and prevent replay from issuing a second effect. Recovery includes the reconciliation interval.',
'An available secondary region means regional recovery is proven.',
'Failover still depends on routing, secrets, capacity, replication lag and write ownership. Failback introduces another transition. Measure the entire rehearsal rather than counting deployed resources.',
'What should a restore drill prove?',
'Usable data, application compatibility, dependency access, observed data-loss window, recovery time and business reconciliation. Preserve evidence and repeat after significant topology or schema changes.'
],
'search-pipelines':[
'Treat a projection as a derived answer',
'The order database records authoritative transactions. A search index reorganizes facts for retrieval, ranking or filtering. A projection is a derived representation maintained from source changes. CDC captures changes from a source mechanism; event time is when the business event happened, while processing time is when the pipeline handled it.',
'An order changes from pending to paid. If a delayed pending event arrives after paid, a blind overwrite moves the projection backward. Carry source versions or an equivalent ordering rule, handle deletion records and define replay identity. For a backfill, connect the snapshot to a change position so updates during the scan are not lost. Refresh delay is visible in search even when the source commit succeeded.',
'Replaying all events always reconstructs the correct view.',
'Only with complete retained history, compatible interpretation, correct ordering/deduplication and a defined starting state. Some sources retain only a bounded log. Schema evolution and external enrichment can also change replay results.',
'Can search results authorize a purchase?',
'Use the authoritative path for current inventory, price and permissions when the invariant requires it. A stale projection can suggest candidates without authorizing the final business mutation.'
],
observability:[
'Connect evidence to a customer question',
'A metric summarizes measurements over dimensions; a log records an event; a trace relates timed operations through propagated context. A business ledger records durable facts needed for correctness and recovery. These are complementary. A trace can be sampled out, while a ledger entry still proves an accepted order exists.',
'A customer asks why a paid order never shipped. Start with order identity, verify payment state, locate the outbox event, inspect consumer receipt and quarantine state, then find the shipment transition. A trace may shorten the search but must not be the only evidence. Measure age from paid to shipped; HTTP success rate would count the earlier acceptance as healthy even while fulfillment is broken.',
'A correlation ID provides idempotency.',
'An ID that links logs does not coordinate concurrent writes or remember a prior result. Idempotency needs a recognized operation identity and durable atomic enforcement over the effect being protected.',
'Why not put every order ID in a metric label?',
'Unbounded identity creates unbounded series and cost. Use bounded labels for aggregate detection and controlled logs/traces/ledgers for individual diagnosis. Redact credentials and sensitive payloads.'
],
'design-practice':[
'Build an argument, not a product diagram',
'A design starts with required behavior, measurable targets and invariants. An invariant rules out an unsafe outcome; a target allows a measured degree of degradation. Constraints include team skills, existing infrastructure and migration cost. A diagram is useful only after these choices explain why each boundary exists.',
'Take booking one remaining seat. A fast browse projection can show availability, but acceptance needs an atomic claim. A payment timeout creates an unknown external outcome, while a reservation expiry changes local ownership. Define who wins that race and how late payment success is refunded or reconciled. Only then select SQL conditional updates, a durable coordinator and messaging for side effects.',
'A named pattern is a complete design justification.',
'An outbox explains reliable publication from a local commit; it does not decide reservation duration, payment uncertainty or authorization. Tie every mechanism to a requirement and name the boundary it leaves uncovered.',
'How should you answer an unfamiliar design prompt?',
'Clarify one user journey and its invariants, estimate workload, define authoritative state and trace a happy path. Then introduce concurrency and one crash at each commit boundary before scaling or selecting products.'
]
};
export function applyTeachingDepth(lessons){
 for(const l of lessons){const d=paths[l.slug];if(!d)throw Error(`Missing teaching path: ${l.slug}`);
 l.sections.splice(1,0,section('reasoning-path',d[0],p(d[1])+p(d[2])+`<div class="callout"><strong>Check your understanding</strong>${qa([['Foundational',d[3],d[4]],['Intermediate',d[5],d[6]]] )}</div>`,'Read this slowly: it establishes the distinction used in the implementation sections.'));
 }
}

// Derivations live beside the relevant mechanism, not only in introductions.
const mechanismWalkthroughs={
scalability:['measure','Read one saturation curve','Begin at low arrival rate and increase it while keeping the request mix fixed. At first, throughput rises roughly with arrivals and latency changes little. Near a limiting resource, waiting rises faster than useful throughput. Beyond that point, extra attempts can consume resources without completing more work. This is the knee you must identify before choosing normal operating headroom. Repeat with cache misses and a failed replica: the curve changes when service time or available capacity changes. A single maximum-RPS number hides those conditions.'],
databases:['indexes','Walk the access path','Imagine the order table as rows that are not naturally arranged for this customer query. Without a suitable access path, the engine may inspect many rows and sort the matches. The composite index arranges searchable keys so equal tenant and customer values narrow a range, followed by the requested recent-order ordering. The unique ID breaks ties when timestamps match. Now change the query to filter only by status: this same leading-key arrangement is not automatically useful. Explain the actual predicate and ordering before reusing an index design.'],
caching:['write-pattern','Follow the writer and the in-flight reader','Draw two timelines before choosing an invalidation rule. The writer commits a new product price and deletes the old cache entry. A reader that loaded the old value before the commit may finish its cache fill after that deletion. The last cache write can therefore contain an older source version. First decide how long this is acceptable; then choose bounded expiry or version coordination. A TTL is a freshness policy under defined assumptions, not proof that each cached value is the latest committed fact.'],
messaging:['outbox','Place the crash between every pair of steps','Start with the unsafe dual write: commit an order, then publish a message. A crash in between loses the publication intent. Reversing the steps allows a published event for a rolled-back order. Storing both order and intent in one local commit removes that gap. The relay still has two steps: publish, then mark sent. A crash there creates a possible duplicate, which is why the consumer must have its own repeat-safe boundary. The outbox converts an unrecorded omission into recoverable repeated work.'],
reliability:['retries','Spend the remaining budget','Suppose the caller has 800 ms in total and the first attempt consumes 500 ms. A second attempt cannot legitimately receive a fresh 800 ms budget. Reserve time for response handling and propagate the remaining deadline through participating calls. Backoff consumes time too. If the remaining budget is too short for useful work, fail or defer according to the contract rather than starting a doomed attempt. Separately establish whether repeating the business operation is safe: time budgeting alone does not prevent duplicate effects.'],
observability:['metrics','Choose the denominator before the dashboard','For an acceptance SLI, the eligible population might be valid authorized checkout requests; a good event might be durable acceptance within the promised time. For completion, the eligible population is accepted operations and the good event is reaching the required business state by its deadline. These denominators differ. Counting every HTTP 202 as a completed checkout hides stranded work. Define how late and still-pending operations enter the measurement so a dashboard cannot improve merely because incomplete work has not emitted a terminal event.'],
networking:['connections','Separate three kinds of waiting','A caller can wait to acquire a pooled connection, wait to establish or secure a new connection, or wait for response data on an established connection. These waits need different observations and limits. An acquisition timeout suggests local contention or connections held too long. A connection failure suggests routing, reachability or setup issues. A response timeout may reflect remote work or a lost response. Start with this classification before changing all timeout settings together; otherwise the change can hide one symptom while allowing more retained work.'],
security:['validation','Explain trust before parsing claims','Decoding a JWT reveals claims; it does not establish that your API should trust them. Verification checks integrity under a key, and validation establishes the intended issuer, audience and temporal conditions for this service. Only after that should the application map claims into its identity model. Authorization then checks a specific resource operation. Keeping these stages explicit explains why accepting any token signed by an organization-wide key can still be wrong when the token was issued for a different audience.'],
consistency:['coordination','Make the intermediate state visible','If inventory and payment are independent authorities, their commits cannot be described honestly as one local transaction. After inventory reserves but before payment is known, the order is legitimately pending. Give that state an owner, expiry policy and recovery action. If the process dies, a durable coordinator must resume from recorded facts, not restart the entire purchase with fresh identities. This is the reason for a state machine: it makes partial progress explicit enough to inspect, retry and reconcile.'],
microservices:['communication','Count the new dependency in one user journey','A method call inside one process becomes serialization, network transit, remote admission, execution and response handling after extraction. Each stage can fail independently, and the caller may not know whether the remote action committed. If every order request now needs six sequential services to respond, their latency and availability become part of the order contract. Draw the critical path, identify information that can be local or asynchronous, and avoid extracting a boundary that requires continuous cross-service coordination for one invariant.'],
'rate-limiting':['algorithms','Derive the token bucket behavior','Imagine a bucket that can hold 100 permits and receives 10 permits per second. Each admitted request consumes one. After idle time, at most 100 can be admitted immediately; after the bucket empties, sustained admission approaches 10 per second. This allows a burst without granting an unlimited sustained rate. It says nothing about how long those requests remain active. A slow endpoint may still need a separate concurrency gate. Define the clock/refill implementation and distributed enforcement scope before treating the arithmetic as a fleet-wide guarantee.'],
'replication-partitioning':['keys','Try the busiest key, not the average key','Suppose a million small tenants spread evenly, but one large tenant contributes half the writes. A tenant-based key looks well distributed by tenant count and poorly distributed by work. Splitting the large tenant across buckets can help, but a query for all of its orders now needs fan-out or another projection. If one individual inventory item is hot, tenant bucketing may not split that atomic claim at all. Key choice must consider access locality, work distribution and the operations that must remain coordinated.'],
'deployment-runtime':['lifecycle','Trace shutdown as a protocol','First stop advertising readiness, then allow routing changes to propagate while active work drains under a bounded grace period. New work may still arrive briefly because upstream state is not instantaneous. A worker should finish a durable unit or relinquish it for repeat-safe redelivery rather than acknowledge unfinished work. Once the grace period expires, termination can be abrupt. The application must therefore recover from the same crash windows even when the platform usually shuts down politely.'],
'disaster-recovery':['backups','Restore the meaning, not just the bytes','A database restore can be internally consistent at an earlier time while external providers contain later facts. Compare the restore point with payment, delivery and message histories before resuming irreversible actions. Restoring an old pending row does not make a later completed payment cease to exist. Recovery needs stable identities to match those facts and a declared authority for each state. Measure the time until those critical journeys are usable; stopping the timer when the database process starts understates recovery duration.'],
'search-pipelines':['cdc','Join the snapshot to the change stream','A baseline scan takes time. While it runs, source rows can change or disappear. A change stream supplies the missing interval only when the scan and stream are connected through a known position or an equivalent consistent protocol. Then handle duplicates and ordering while applying both. Starting an arbitrary stream after a bulk copy can lose updates made during the copy; starting before it without an apply/version rule can let older copied values overwrite newer changes.'],
'design-practice':['booking','Resolve expiry and payment as a race','A reservation expires at 10:05 while a payment worker completes at nearly the same moment. Reading the status and then writing confirmed is insufficient because another worker may release the reservation in between. Use conditional transitions at the authority and a business rule for late success. If the seat was already reassigned, the system cannot honestly confirm both customers. Persist a recovery action such as refund or manual resolution, with its own repeat-safe identity, and expose the appropriate intermediate state.']
};
export function expandMechanismDerivations(lessons){for(const l of lessons){const [id,title,explanation]=mechanismWalkthroughs[l.slug]||[];const target=l.sections.find(s=>s.id===id);if(!target)throw Error(`Missing mechanism section for ${l.slug}`);target.html=p(`<strong>${title}.</strong> ${explanation}`)+target.html;}}
