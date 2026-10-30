import {p,table,qa} from './lesson-helpers.mjs';
const content={
caching:{
problem:[
'The database lesson improved the cost of a query with an index. The same popular product can still cause that query to run thousands of times. A cache keeps an answer for reuse, often nearer the caller. We first save repeated work, then ask what happens when the authoritative product changes while an older answer remains available.',
'Keep browsing and purchasing separate. A customer may tolerate a slightly old description while scrolling, but accepting a purchase at an invalid price or against unavailable stock is a different decision. The right cache policy follows the operation’s correctness and freshness requirements. It does not follow simply from having Redis available.'
],
requirements:[
'A freshness contract states what observations are permitted, under which conditions and failure modes. “Cache for sixty seconds” describes an entry policy; “no answer more than sixty seconds behind a committed update” is a stronger end-to-end claim. A reader can fetch an old source version and publish it late, or another cache layer can reuse it longer. Explain those intervals before claiming a staleness bound.',
'Define identity before expiry. The same product ID can produce different views for tenants, languages, currencies or permission contexts. Reuse is safe only across callers entitled to the same representation. A fast wrong-tenant hit is a security failure, not a cache-performance improvement. State whether the cache is disposable and what the service will do when it cannot reach it.'
],
'read-pattern':[
'Follow a cold lookup: build the complete representation key, ask the cache, and on a miss load the authoritative data and publish a reusable value with its policy. A miss is expected. The source path must therefore be bounded and observable in normal operation, not only during an outage. Distinguish a missing product, an unavailable source and an undecodable cached value.',
'Now let a hundred callers miss the same popular key. The basic pseudocode can send a hundred identical database reads before any fill becomes visible. A local single-flight mechanism lets equivalent callers share one in-progress fill inside that process; other processes may still refill independently. Bound waiting and fill concurrency, and define what happens if the fill fails. Do not let a slow fill hold every caller indefinitely.',
'Fill publication is a separate event from the source read. Carry source/version information when the freshness protocol needs it. A method returning a value does not establish that it is still the latest value when the cache write completes. That is the race explored next.'
],
'write-pattern':[
'Place a reader and writer on the same timeline. The reader loads version 7; the writer commits version 8 and invalidates the key; the reader then publishes version 7. The delete was successful, yet an older value reappeared. This is why write-then-invalidate needs an explicit concurrent-fill policy rather than a slogan.',
'A versioned immutable key prevents one version from overwriting another, but the caller still needs a trustworthy way to find the current version. A version-aware publication rule needs durable knowledge or a marker that survives an absent key; comparing only against a cache value that has already been deleted does not preserve that knowledge. A delayed second delete can reduce particular races without proving a general bound.',
'Choose the least coordination that meets the contract. A browse view may tolerate bounded stale answers under documented assumptions. An inventory or permission decision can use the authoritative mutation path. Durable invalidation intent, such as an outbox row committed with the update, helps recover lost invalidations but still does not make a source transaction atomic with all cache readers.'
],
layers:[
'A local Caffeine cache belongs to one Java process; another process can hold a different copy. A Redis/Valkey cache is shared through a network dependency and serialization contract. A CDN stores HTTP representations under HTTP/cache-key rules. These layers can reduce different costs and can coexist, but every extra copy needs an identity and freshness policy.',
'Trace an update through all layers. If Redis refreshes but a process keeps an older local copy, the shortest TTL does not automatically govern the user’s observation. A freshly fetched lower-layer entry can already contain stale data. Use source/version or age evidence appropriate to the contract and avoid stacking independent TTLs without analyzing the resulting lifetime.',
'Spring’s cache annotation expresses interception and lookup behavior, while the selected provider defines expiry, serialization and operational details. Under normal proxy mode, self-invocation bypasses the cache interceptor. Review key construction and configuration as part of correctness. A cached method result and a shared HTTP response are different layers with different privacy and validation rules.'
],
capacity:[
'Expiration makes an entry ineligible according to time policy; eviction removes it because of capacity or another policy. Both produce misses, but neither guarantees that a business subscriber receives a durable deletion event. Estimate the working set using realistic key/value encoding, metadata and copies, then measure memory and eviction under the real popularity distribution.',
'A stampede is many callers refilling equivalent data concurrently. Coalesce same-key work where appropriate, spread mass expiry with jitter and cap total source-facing fills. Jitter distributes expiry times; it does not supply capacity for one extremely hot missing key. Coordination needs timeout/ownership rules so a failed filler does not strand future callers.',
'Negative caching stores an intentional not-found result for a defined interval. Use a distinct representation and appropriate invalidation after creation. A database timeout is uncertainty, not proof that the product does not exist. Caching the timeout as absence can turn a transient dependency incident into persistent incorrect answers.'
],
worked:[
'For the flash-sale catalog, define which view is reusable before choosing layers. Public images can use an edge cache; tenant/locale product descriptions can use a shared view; personalized discounts must have a separate representation policy. Checkout independently validates authoritative pricing and stock. Browsing freshness is not permission to commit the purchase.',
'Commit merchant changes and a durable invalidation intent together. The invalidator retries its own work under stable identity. Refill must account for the reader/writer race and protect the database with bounded concurrency. If Redis fails, decide which reads may use a permitted stale copy, which may use constrained fallback, and which must fail/defer. An unconditional “catch exception and query SQL” path can multiply source traffic catastrophically.',
'Prove recovery with more than hit ratio: examine source work, fill latency, age/version, eviction, error rate and useful checkout completions. Repeat with a cold start, a slow old reader, an invalidation outage, a hot key and an intentionally wrong tenant/locale key. These experiments test distinct correctness and capacity boundaries.'
],
pitfalls:[
'Cache recovery can be as demanding as cache failure. Reconnecting processes may all refill at once, and a serialization rollout may make old entries unreadable across the fleet. Version representations and roll readers/writers compatibly. Bound fallback and refill before enabling traffic after a cold start.',
'If the cache holds the only copy of an accepted business fact, it is functioning as a primary data store and needs a corresponding durability/recovery design. Likewise, keyspace notifications cannot become the only durable trigger for required work. Choose mechanisms according to what loss or duplication the business can tolerate.'
],
references:[
'Read the provider documentation to verify what expiry, eviction, persistence, notifications and coordination actually mean. Read Spring’s cache documentation to locate the interception boundary. Then compare those mechanisms against one precise operation and its failure contract rather than treating @Cacheable as an end-to-end consistency guarantee.',
'The next lesson makes a different kind of copy durable: an intent or fact passed to another process. Unlike a disposable cached view, accepted asynchronous work must survive the producer’s lifetime and have an explicit completion/recovery protocol.'
]
},
messaging:{
problem:[
'Checkout already committed the order, but a slow email provider is keeping the HTTP caller waiting. The business can often acknowledge the order before the receipt is sent. Separate those completion points explicitly: order acceptance is one durable fact; sending the receipt is pending work with its own owner and deadline.',
'An in-memory executor changes timing but does not preserve work after a process crash. A durable handoff records the intent independently of the current request thread. This removes one lifetime dependency and introduces new responsibilities: recognizing repeated delivery, measuring delayed completion and deciding when the intermediary may stop retaining work.'
],
requirements:[
'Name the business acceptance point and the final effect. “No lost receipt intent after order commit” requires a durable connection between the local change and publication; “no duplicate shipment” requires protection at the effect boundary. These are separate guarantees. A broker feature solving delivery does not automatically solve either local atomicity or remote-provider uncertainty.',
'A command requests an action from a responsible owner; an event describes a fact that interested consumers can interpret. SendReceipt is a command, while OrderAccepted is an event. Define their identity, schema, ownership, retry horizon and completion expectations. Independent consumers need independent progress and failure handling so analytics cannot accidentally govern shipping availability.'
],
models:[
'A work queue assigns pending work among competing workers. Publish/subscribe creates separate delivery paths for independent reactions. A retained log keeps records by policy while consumers track positions. Choose from the reader’s required behavior: one owner processing a job, several independent reactions, or consumers needing ordered replay while history remains available.',
'In a Kafka consumer group, partition assignment constrains parallel progress; adding more consumers than useful partition work does not force additional throughput. Different groups can read independently. In SQS, distinguish standard-queue repeat/ordering behavior from FIFO ordering and send deduplication. In both cases, the application must define when a durable business effect is complete.',
'Ordering also has scope. Grouping by order ID can serialize that order’s events without imposing one global sequence on every order. A hot order/key or a slow handler can still constrain the chosen scope. Preserve the business reason for ordering rather than assuming a globally ordered stream is always safer.'
],
ack:[
'Follow one delivery through receive, local commit and acknowledgement. If the consumer acknowledges first and then dies, the effect can be lost. If it commits first and dies before acknowledging, the message can repeat. Those failure windows are unavoidable when the broker and local store do not share the relevant atomic protocol; the processing contract must tolerate the selected recovery behavior.',
'For a protected local mutation, insert a consumer-scoped event receipt and apply the mutation in one transaction. A unique identity decides whether that work already committed. If it did, the repeat can acknowledge without repeating the effect. If the transaction failed, the receipt must not remain as false proof of completion. Different legitimate consumers need different receipt scopes.',
'A remote carrier or payment provider remains outside that local transaction. The inbox can prove that a local fulfillment task was created once; it cannot by itself prove one remote shipment. Persist the remote intent, reuse its provider identity and reconcile unknown outcomes. Retain receipts for the actual redelivery/replay horizon, not an arbitrary cleanup interval.'
],
outbox:[
'The producer has its own dual-write problem. Database-first can commit an order and crash before publishing; broker-first can publish a fact for an order that never commits. Record the business change and publication intent in the same local transaction. The relay reads committed intents and publishes them later, so a producer crash leaves recoverable pending work.',
'The relay still has a publish/mark-sent gap. If publication succeeded and the relay dies before recording that result, it can publish again. Keep event identity stable across those attempts. The outbox changes an unrecorded omission into recoverable potentially repeated delivery; the consumer’s effect protocol handles repetition.',
'An after-commit callback can reduce perceived delay but is not a substitute for durable pending intent. Similarly, committing an SQL transaction and a broker transaction in sequence does not erase the failure interval between them. State the exact participating resources and recovery ledger instead of implying an annotation supplies universal atomicity.'
],
ordering:[
'Arrival order, business event order and effect completion order can differ. One handler may finish slowly while a later event’s asynchronous effect finishes first. Include an aggregate identity and a version/ordering rule where the business requires one. A delayed old state should not blindly overwrite a newer state merely because it arrived later.',
'Schema compatibility must cover retained history and delayed work, not only the newest producer and consumer. Define how readers treat optional additions, unknown event types and incompatible versions. A poison event may require quarantine, but skipping it can let later events for the same aggregate overtake a prerequisite. Choose that ordering/recovery policy explicitly.',
'Replay is safe only for the effects being rebuilt. Reconstructing a search projection can use a replay-specific path that suppresses external email or shipment. Keep stable source identities, define the starting snapshot/log position and verify completeness. Resetting an offset alone does not prove a correct reconstruction or restore history that retention already removed.'
],
implementation:[
'Acknowledge/delete and commit-position APIs expose broker-specific progress. In SQS, visibility temporarily hides received work; expiration can make it available to another worker. In Kafka, consumer positions and group participation have their own poll/processing rules. Neither replaces effect idempotency. Configure the actual Spring listener/client behavior rather than assuming return from a method always means the same acknowledgement boundary.',
'Use bounded retries for transient failures and a deliberate path for deterministic failures. Quarantine preserves the event, error, schema and business identity for diagnosis. A dead-letter queue is a location for unresolved work, not resolution. Fix the reader or data under policy, replay with original identities and prove the business state recovered.',
'Measure age and useful completions alongside broker counters. A decreasing queue can mean successful processing, expiration, quarantine or loss under a bad acceptance contract. Scale consumers only within database/provider capacity and ordering constraints. Backlog per worker is useful only when its relationship to processing cost and the completion target is understood.'
],
worked:[
'Commit the confirmed order transition and OrderPaid intent locally. A relay publishes the stable event. A fulfillment consumer commits its receipt and a local fulfillment task together, then acknowledges. A separate runner performs the remote warehouse interaction using a durable fulfillment identity. Each boundary has a ledger that survives the current process.',
'Now lose the warehouse response after acceptance. The local task becomes UNKNOWN until provider lookup, supported repeat-safe retry or reconciliation establishes the result. Creating a fresh shipment because the worker timed out would discard the identity needed to prevent duplication. Analytics and receipt delivery use independent progress so their failures cannot consume fulfillment’s entire budget.',
'Validate every gap: order commit/before publication, publish/before sent mark, local consumer commit/before ack, and remote acceptance/before result recording. Include duplicate, delayed, out-of-order and incompatible-schema deliveries. Assert durable fulfillment identity and state, while monitoring oldest business-state age and unresolved recovery work.'
],
pitfalls:[
'A queue absorbs a burst only when the system can later process the admitted work within its deadline. Sustained excess arrivals produce backlog age and cost, even if HTTP acceptance stays fast. Bound admissions or provide a declared deferred/rejected response before accepting work the system cannot honor.',
'“Exactly once” requires a scope. Supported Kafka transactions can coordinate selected Kafka writes and consumed positions under the configured model; they do not make an arbitrary external SQL, email or provider effect atomic. Keep the resource boundary, duplicate identity and recovery protocol visible in every design claim.'
],
references:[
'Read broker documentation for retention, redelivery, ordering and progress semantics, and framework documentation for listener acknowledgement and transaction boundaries. Compare a specific crash window with those guarantees. Product labels and default configurations do not establish an end-to-end business effect.',
'Then connect messaging to distributed consistency: separate local durable facts, delayed observations and independent service commits. The next lesson explains which states users may see while the workflow is between those commits.'
]
}
};
export function deepenCopiesAndDelivery(lessons){
 for(const [slug,sections] of Object.entries(content)){
  const l=lessons.find(x=>x.slug===slug);if(!l)throw Error(`Missing ${slug}`);
  for(const [id,paragraphs] of Object.entries(sections)){
   const target=l.sections.find(s=>s.id===id);if(!target)throw Error(`Missing ${slug}/${id}`);
   target.html=paragraphs.map(p).join('')+target.html.replace(/^(?:<p>[\s\S]*?<\/p>)+/,'');
   if(id==='references')target.cue='Carry the operation and its guarantee into the next lesson.';
  }
 }
 const cache=lessons.find(x=>x.slug==='caching');
 cache.sections.find(s=>s.id==='write-pattern').html+=table(['Step','Source','Cache consequence'],[['Reader loads version 7','Version 7 observed before update','Fill is still in progress.'],['Writer commits version 8','Version 8 authoritative','Invalidation removes the current entry.'],['Old reader fills late','Source still version 8','Version 7 can reappear without a stronger protocol.'],['Choose a policy','Define acceptable observation','Bounded stale display, coordinated publication, or authoritative decision path.']]);
 cache.sections.find(s=>s.id==='interview').html+=qa([['Intermediate','Does a 60-second TTL prove an answer is at most 60 seconds behind the latest write?','Not by itself. Identify when the source value was observed, when it was published, concurrent invalidation/refill and other cache layers. A late old fill can create a fresh entry containing old data. State the assumptions behind the bound or use an authoritative/coordinated path.'],['Advanced','What must a cache outage policy protect?','The business invariant, tenant isolation and source capacity. Bound fallback/refill concurrency, use stale data only where permitted, and reject/defer optional reads when necessary. A universal catch-and-query fallback can move the outage to the database.']]);
 const msg=lessons.find(x=>x.slug==='messaging');
 msg.sections.find(s=>s.id==='worked').html+=table(['Crash window','Durable evidence','Recovery'],[['Before producer commit','No committed order/intent','Retry under original command identity.'],['After commit, before publish','Committed outbox intent','Relay publishes it.'],['After publish, before sent mark','Intent may be published again','Stable event identity and consumer repeat safety.'],['After consumer commit, before ack','Inbox plus local task','Repeat acknowledges without duplicating local task.'],['After remote acceptance, before result record','Durable remote intent; outcome unknown','Provider identity/inquiry and reconciliation.']]);
 msg.sections.find(s=>s.id==='interview').html+=qa([['Intermediate','Why does an outbox still require consumer deduplication?','The relay can publish successfully and crash before recording publication. Republishing is the safe recovery for that uncertainty. A stable event identity plus the consumer’s atomic receipt/effect boundary handles the repeat.'],['Advanced','Can a dead-letter queue prove the business recovered?','No. It isolates unresolved work. Preserve identity, establish failure cause and ordering impact, repair under policy, replay safely and verify the intended durable business state. Queue depth alone cannot establish completion.']]);
}
