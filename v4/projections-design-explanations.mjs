import {p,qa} from './lesson-helpers.mjs';
const content={
'search-pipelines':{
problem:[
'The order database is authoritative, but product search needs relevance, text analysis and retrieval shapes different from the write model. A projection derives a read representation from source facts. It can make queries useful without becoming the authority for inventory, current price or permission.',
'Follow one source change until it is searchable. There is an interval between commit and projection visibility, and failures can extend that interval. Define freshness and recovery before adding a search engine; otherwise a fast search result can be mistaken for a current business decision.'
],
requirements:[
'Write both the retrieval need and the freshness contract. Text ranking, filters, facets and exact lookups are different operations. Bound result size and query cost, enforce tenant/security policy, and identify which decisions must be rechecked authoritatively after search returns candidates.',
'For the pipeline, define source identity, versions, deletion handling, retained history and recovery ownership. A backfill must coexist with live updates, and replay must not repeat external side effects. Measure age/version lag and reconciliation errors alongside indexing throughput.'
],
index:[
'A search index reorganizes documents and terms for retrieval. Analysis/tokenization changes what queries mean; an exact identifier lookup and a relevance-ranked description search need different field/query choices. Model filters, sorting and access control explicitly rather than indexing raw database rows without a retrieval contract.',
'Index publication and refresh can delay visibility after ingestion. That is separate from source commit success. A search hit is evidence from a derived view; authorize the final resource operation and validate current inventory/price through the required authority. Restrict fields and query complexity so one flexible search cannot create unbounded work or disclose other tenants.'
],
cdc:[
'Change data capture (CDC) obtains changes through a supported source mechanism. It is not automatically a complete domain event contract: row changes may require interpretation, ordering and transaction-context handling. State which source position and identity let the consumer recognize progress and repetition.',
'Join a consistent baseline to subsequent changes using a known position or equivalent supported protocol. A bulk scan followed by an arbitrary later subscription can miss intervening updates; applying an old copied row after a newer event can regress the projection. Carry version/ordering guards, handle deletions and verify reconciliation under concurrent source writes.'
],
time:[
'Event time describes when the business event happened; processing time describes when the pipeline handled it. A delayed event can arrive after a later business fact. Windowed aggregates need an explicit late-data and correction policy rather than treating arrival order as business order.',
'Choose what a watermark or lateness threshold means for your source and result contract. Closing a window is a policy decision, not proof that no earlier event can ever appear. Retractions/corrections, deduplication and replay must preserve the intended aggregate when historical data changes or arrives late.'
],
implementation:[
'Use a pipeline with explicit source positions, repeat-safe writes and observable failure/quarantine state. On AWS, managed stream/search services can supply parts of ingestion and storage; framework connectors can manage checkpoints. Verify the actual retention, delivery, ordering and schema behavior rather than transferring guarantees between services.',
'For Spring consumers, keep local processing and acknowledgement boundaries clear. Separate a projection rebuild from external business effects, budget its load and support compatible schema evolution. If retained changes are insufficient for replay, establish another baseline instead of assuming an offset reset can reconstruct lost history.'
],
worked:[
'Rebuild order search while customers continue updating orders. Establish a source baseline and continuation position, populate an isolated target view, then apply subsequent changes with the chosen version/deletion rules. Compare critical identities, counts and sampled/domain-specific results before routing reads.',
'Exercise an update during the scan, a delete, duplicate events, old schemas and a lagging consumer. Confirm that no older copy overwrites a newer fact and no deleted/unauthorized resource leaks through the final access path. After cutover, retain an explicit rollback/reconciliation plan and observe freshness under real load.'
],
pitfalls:[
'A healthy ingestion process can still produce wrong search: stale permissions, missing deletes, incompatible analysis or silent rejected documents can all escape a throughput graph. Inspect failure records, result correctness and source-to-view reconciliation.',
'Do not make a projection the accidental authority for an invariant merely because it is fast. Rebuilds, lag and retention gaps must have declared behavior, and expensive queries need admission/limits independent of source-write capacity.'
]
},
'design-practice':{
problem:[
'You now have mechanisms for contracts, state, copies, delivery and recovery. A design exercise asks you to assemble only the mechanisms required by one problem and defend their boundaries. Begin with a user journey, functional behavior, measurable targets, invariants and constraints before drawing products.',
'Follow a normal transition, then interrupt it at each commit or remote call. State what the caller sees, which fact is authoritative and what identity lets recovery continue. Capacity estimates and implementation mappings come after that argument so the diagram explains a solution rather than disguising missing requirements.'
],
requirements:[
'Ask questions that change a decision: must a booking be final immediately, may search be stale, how long can notifications be delayed, and what must never be duplicated? Separate illustrative load assumptions from known requirements and identify the busiest key or tenant, not only aggregate volume.',
'Include failure, migration and operating constraints. Who owns unresolved work? How are contracts rolled out? What data loss and recovery time are acceptable? A design that works only when every dependency responds promptly has not answered a distributed-systems prompt.'
],
'url-shortener':[
'A short link maps a public identifier to a destination. Begin with unique creation, lookup latency, destination validation, expiry and abuse handling. Choose an identifier-generation/collision protocol and define what a caller may observe if a new mapping has not reached a read copy.',
'Caching can reduce popular lookup cost, but update/deletion and malicious-destination policy affect freshness. A redirect is an HTTP contract with client/cache behavior, not just a database row. Rate-limit creation and investigate hot links, skew and invalidation before adding partitions merely because total link count is large.'
],
notifications:[
'A notification system separates durable business intent from delivery attempts. The event identifying a required notification differs from provider attempts and user/channel preferences. Define whether completion means accepted by a provider, delivered to a device or acknowledged/read by a person; those are different evidence boundaries.',
'Use durable handoff, per-channel retry policy and stable provider identity where supported. An accepted send with a lost response can repeat; an inbox at the local consumer does not necessarily prevent a second external message. Record residual duplicate risk and recovery policy rather than promising exactly-once delivery to a human.'
],
chat:[
'A persistent WebSocket carries live interaction but does not by itself store a message or guarantee delivery after disconnect. Define the durable acceptance point, message identity, conversation ordering and what a reconnecting client uses to resume. Receipt states should say precisely whether data reached the server, device or reader.',
'Partition by access/locality needs while considering very large groups and fan-out. Bound slow-client buffers, enforce conversation membership at authoritative access and handle duplicates/out-of-order arrivals. Presence is often an expiring observation, while durable message history needs a different retention/recovery contract.'
],
booking:[
'Browsing availability can use a delayed view; confirming the last seat requires an authoritative atomic claim. Model reservation identity, expiry and allowed transitions before adding payment. Distinct legitimate customers can compete even when each request is individually idempotent.',
'Payment completion can race reservation expiry. Conditional transitions decide which state wins, and late success needs the declared re-reserve/void/refund policy. Persist unknown provider outcomes and recovery identity. A distributed lock or queue cannot replace the business rule for an already-reassigned seat.'
],
files:[
'Separate file authorization/lifecycle control from bulk byte transfer. The API issues a scoped upload intent, storage receives bytes, and finalization verifies the intended object before making it usable. Integrity checks, content inspection and ownership are different validations.',
'Handle abandoned multipart uploads, overwrite/reuse behavior and publication races. A download capability has an effective lifetime and may outlive a permission change unless the access protocol prevents that. Keep private objects inaccessible until the required lifecycle state and authorize each new capability request.'
],
worked:[
'For payments, begin with one intent and the point at which money can move. Persist stable local/provider identity, define local and remote commit boundaries, and treat a timeout after submission as an unknown outcome. Use inquiry, supported repeat-safe retry and reconciliation before issuing another irreversible action.',
'Then integrate inventory and fulfillment. Protect local invariants with appropriate atomic mutations, publish committed intents durably, make consumer local effects repeat-safe and reconcile external effects separately. Validate crash gaps, expiry races, cross-tenant access and peak/failure capacity. The chosen AWS/Spring components must map to these responsibilities rather than substitute for the argument.'
],
pitfalls:[
'A pattern name is not a complete justification. An outbox does not choose reservation duration; a replica does not establish fresh reads for every operation; a circuit breaker does not provide idempotency. For each component, state the requirement it serves, its cost and the boundary left unprotected.',
'Finish with evidence: representative capacity measurements, invariant assertions, failure/recovery walkthroughs, compatibility tests and operating ownership. Expose a constraint that makes a requested guarantee impossible rather than silently weakening it or drawing another service.'
]
}
};
const followups={
'search-pipelines':[['Intermediate','Why can a backfill lose an update even when every scan query succeeds?','The source changes while scanning. Without a baseline/change-position protocol and correct apply ordering, an intervening update can be missed or overwritten by an older copied row. Verify concurrent changes, deletes and versions.'],['Advanced','Can a retained log alone guarantee a correct projection rebuild?','Only under explicit assumptions about complete retained history, starting state, compatible interpretation, ordering and deduplication. Retention gaps or changed external enrichment can require another baseline and reconciliation.']],
'design-practice':[['Intermediate','Which failure should you analyze first in an unfamiliar prompt?','Locate the authoritative commit or irreversible remote effect, remove the response and ask what the caller knows. Then introduce concurrent legitimate operations and a crash on either side of each commit boundary.'],['Advanced','How do you compare two plausible architectures fairly?','Use the same requirements, invariants, workload, failure conditions and team constraints. Compare protected boundaries, intermediate states, recovery burden, measured capacity and cost, and record evidence-based revisit triggers.']]
};
export function deepenProjectionsAndPractice(lessons){for(const [slug,sections] of Object.entries(content)){const l=lessons.find(x=>x.slug===slug);if(!l)throw Error(`Missing ${slug}`);for(const [id,paras] of Object.entries(sections)){const t=l.sections.find(s=>s.id===id);if(!t)throw Error(`Missing ${slug}/${id}`);let rest=t.html.replace(/^(?:<p>[\s\S]*?<\/p>)+/,'');for(const v of t.html.match(/<p>(?:Test |Validate )[\s\S]*?<\/p>/g)||[])if(!rest.includes(v))rest+=v;t.html=paras.map(p).join('')+rest;}l.sections.find(s=>s.id==='interview').html+=qa(followups[slug]);}}
