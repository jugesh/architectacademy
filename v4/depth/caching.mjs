import {p,code,table,qa,refs,section,warn} from '../lesson-helpers.mjs';
export const cachingDepth=[
{after:'write-pattern',...section('invalidation-race','A stale fill after deletion',
p('Cache-aside has a race that “delete after write” does not close. Reader A misses, reads product version 7 from the database and pauses. Writer B commits version 8 and deletes the cache entry. A resumes and puts version 7 into the now-empty cache. Every step succeeded, yet the cache is old immediately after invalidation. The problem is the order of observations and publication, not a failed Redis command.')+
table(['Time','Reader A','Writer B','Cache'],[['1','Miss; read source version 7','','Empty'],['2','Pause','Commit version 8','Empty'],['3','','Delete cached product','Empty'],['4','Publish delayed version 7','','Version 7']])+
p('Choose a freshness contract before choosing a repair. If a catalog description may be stale briefly, bounded fill duration plus a hard entry lifetime may be sufficient. If a price or authorization decision must reflect the current authoritative fact, the checkout/authorization path must validate that fact through its appropriate authority. A best-effort invalidation event cannot turn a stale browse cache into a transaction boundary.')+
code(`Conceptual version-aware cache publication, NOT a Redis client API:
  candidate = source.readWithVersion(product)
  cache.atomicForThisKey(() -> {
    if (candidate.version < invalidationFloor) rejectFill();
    if (current != null && candidate.version < current.version) rejectFill();
    else store(candidate, remainingFreshnessLifetime);
  });

On a committed invalidation for source version v:
  atomically raise invalidationFloor to max(invalidationFloor, v);
  remove any cached representation older than v;`)+
p('The comparison and publication must be atomic in the cache authority. A Java read of the floor followed by a separate SET has another race. Events must carry a comparable authoritative version; wall-clock timestamps from arbitrary machines are not automatically an ordering rule. Duplicate or reordered invalidations must not move the floor backward. Deletions also need a tombstone/version rule so an old fill cannot resurrect a removed product.')+
p('This protocol is conditional on its metadata surviving and on invalidations arriving. If eviction or failover loses the floor, an old loader can publish again. If the source commits but publication of its invalidation is lost, the cache does not know version 8 exists. A durable outbox/change stream can make delivery recoverable, but its delay still creates a stale window. To promise a strict bound, include delivery delay, loader lifetime, source-read freshness and all downstream cache layers, or use authoritative validation at the decision boundary.')+
p('A second delayed delete is a mitigation with an assumed maximum loader delay, not a universal proof. A paused process can resume later than that delay. Similarly, a 60-second TTL begins when the value is installed, not necessarily when the underlying snapshot was observed. A loader delayed for ten minutes can otherwise install a ten-minute-old value for another minute. Bound the loader or carry trusted observation/expiry metadata and refuse an already-expired candidate.')+
qa([['Advanced','Does a higher cached version guarantee that the value is current?','No. It prevents a known older publication under the cache protocol. A source update whose invalidation has not arrived can still be newer. Distinguish monotonic cache publication from authoritative freshness.'],['Intermediate','Can I use the same version floor for every representation?','Only if the source version and invalidation semantics cover those representations. A product description, tenant-specific price and permission decision can have different authorities and lifetimes.']]))},
{after:'capacity',...section('refill-leases','Stampedes and refill leases',
p('A popular key expires while 2,000 requests are waiting. If every miss independently reads the database, a cache that normally saves work becomes a synchronized load multiplier. First use single-flight within one process: callers for the same key share one bounded loader. Across ten pods, that can still mean ten loaders. A distributed refill lease can reduce duplicate work further, provided losing the lease does not compromise business correctness.')+
code(`# Redis command shape; token is random and unique to THIS acquisition.
SET cache-refill:{product-42} <owner-token> NX PX 3000

-- Lua release: KEYS[1] is the lease key; ARGV[1] the owner token.
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end`)+
p('The token comparison and delete occur atomically. A plain DEL in finally is unsafe: A’s lease expires, B acquires it, then A deletes B’s lease. The token distinguishes acquisitions; it is not merely a pod name. The braces illustrate a Redis Cluster hash tag for this key, not a requirement to place every product in one slot. Multi-key scripts have additional placement constraints.')+
p('Three seconds is illustrative. If A pauses beyond the lease, B may start another refill while A still runs. A conditional release prevents A from deleting B’s lease; it does not stop A publishing stale data or writing a remote effect. Combine refill publication with the freshness/version contract where needed. Never use this optimization as the sole authority for stock deduction, money transfer or tenant authorization.')+
table(['Caller situation','Bounded behavior','What must not happen'],[['Won lease','Load within a deadline; publish eligible value; conditional release','Hold an unbounded request while the source stalls.'],['Lost lease; permitted stale value exists','Return stale within the hard policy; let owner refresh','Reset the hard lifetime on every stale hit.'],['Lost lease; no usable value','Brief bounded wait/recheck or controlled rejection','Spin, poll indefinitely or send every waiter to the source.'],['Redis unavailable','Follow a finite fallback/admission policy','Unlimited bypass that overloads the database.']])+
p('Jitter entry lifetimes or refresh thresholds so unrelated keys do not all refresh at the same instant. Jitter must stay within the permitted freshness envelope. A soft refresh threshold can trigger background work while the value is still allowed; a hard expiry forbids serving it. Separate the two explicitly. “Stale while refreshing” is only valid for operations whose contract permits that stale representation.')+
p('A Redis failover can weaken lease exclusion under the selected replication protocol. For a cache refill, occasional duplicated work may be acceptable if source load and publication are bounded. That is a different requirement from exclusive ownership of an irreversible action. Measure duplicate fills, waiters per key, source work per miss and hard-expired serves rather than treating successful lease acquisition as proof of correctness.')+
qa([['Advanced','Why can renewal still fail to make a lease a correctness lock?','A paused or partitioned owner may continue after renewal fails or after another owner takes over. The protected resource needs an appropriate fencing/atomic authority protocol. Extending a cache key alone cannot revoke an old process’s ability to act.']])+
refs([['https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/','Redis lock documentation','ownership tokens, expiry and failover assumptions.']]))},
{after:'layers',...section('representation-identity','Cache the right representation',
p('A key is a claim that every request mapped to it may reuse the same representation. The URL path alone rarely establishes that. The same product can have a locale-specific description, currency-specific display and tenant-specific price. A response filtered by a user’s entitlements may vary even within one tenant. Missing a dimension can return a fast, validly encoded response to the wrong audience.')+
code(`Illustrative logical key, serialized with unambiguous encoding:
  schema = catalog-view-v3
  tenant = authorized tenant identity
  product = validated product identity
  locale = normalized supported locale
  currency = normalized supported currency
  priceList = authorized pricing context/version

Do NOT derive authorization from a caller's cache-key string.
Do NOT concatenate arbitrary fields without length/escape rules.
Do NOT put bearer tokens or personal payloads into readable keys.`)+
p('The key schema is versioned so a representation change does not reinterpret old bytes. Normalize only what is semantically equivalent: lowercasing a case-sensitive identifier can merge distinct resources. Bound key length and allowed variants so arbitrary query strings cannot create an uncontrolled cache working set. Protect key/value visibility because cache administration and telemetry often expose more than the application response.')+
p('Authorization must precede reuse of a protected value, or the cached value itself must be partitioned and validated under an explicit authorization policy. A tenant prefix prevents one class of collision; it does not prove the current actor may read every object in that tenant. An administrator-only field cached inside a general customer representation can leak even when the tenant is correct.')+
table(['Cached item','Safe question to answer','Additional requirement'],[['Public description','May this reusable public text still be shown?','Freshness and representation identity.'],['Tenant price list','Which authorized pricing context owns this value?','Tenant/context identity and checkout validation policy.'],['Negative lookup','Was not-found observed for this exact scope?','Short deliberate lifetime; creation/invalidation behavior.'],['Permission result','How quickly must revocation take effect?','Bounded decision freshness or current-authority check.']])+
p('Negative caching helps repeated absent lookups, but can hide a newly created object. A not-found observed through a lagging replica may not mean authoritative absence at all. Do not cache a transient timeout as a permanent not-found. Classify absence, authorization denial and dependency failure separately; their reuse and disclosure policies differ.')+
p('At HTTP/CDN layers, review actual cache-control and variation behavior, not just the Redis key. A private response stored by an intermediary under a public cache rule can bypass an otherwise correct application cache. Conversely, varying on every arbitrary header can destroy reuse or explode cardinality. Test the end-to-end path with two tenants, two roles and a revoked permission, including warm caches and repeated conditional requests.')+
qa([['Intermediate','If every key includes tenant ID, have we solved multi-tenant caching?','No. The tenant must come from trusted authorization context, the actor must still be allowed the resource/action, variants must not collide, and every cache layer must honor the same disclosure policy.'],['Advanced','Why is a stale permission cache more dangerous than a stale product description?','It can permit an operation after authority was revoked. The permitted revocation delay is a security requirement; a convenient TTL cannot silently choose that requirement.']]))},
{after:'worked',...section('cache-outage-budget','Survive cache loss',
p('Model the cold path before deciding to bypass Redis on failure. An illustrative catalog receives 1,000 requests/s. With 90% hits and two source reads per miss, ordinary source demand is 1,000 × 0.10 × 2 = 200 reads/s. Total cache loss makes that 2,000 reads/s before retries, background fills and checkout traffic. A source sized near the warm-cache baseline cannot absorb the bypass simply because the application has spare CPU.')+
table(['Condition','Calculated source demand','Interpretation'],[['90% hit ratio','200 reads/s','Warm illustrative baseline.'],['50% hit ratio','1,000 reads/s','Five times the baseline.'],['Cache unavailable','2,000 reads/s','Ten times the baseline before amplification.'],['Validated spare read budget = 400 reads/s','At most 200 two-read misses/s','Other required work is already reserved outside this budget.']])+
p('The last line is a demand budget, not a recommended connection-pool setting. The source might execute some expensive queries much more slowly than others. Measure useful throughput, lock waits and latency for the actual mix. Fleet-wide admission must respect the aggregate budget: giving each of ten pods a 200-miss/s fallback budget would overspend it tenfold.')+
code(`Conceptual cache-failure branch:
  if reusable cached value exists within allowed hard lifetime:
      return it only for operations that permit stale data
  if source admission and deadline budgets permit:
      perform bounded authoritative read; publish only if eligible
  else:
      reject/degrade optional browsing under the API contract

Checkout stock/permission decisions retain their authoritative path.
A cache outage must not manufacture inventory or permission success.`)+
p('Separate caches by the value of the work they protect where appropriate. Optional browse traffic should not consume every connection needed for order acceptance or reconciliation. Bound refill concurrency during a recovery, since all entries may be cold simultaneously. Prewarming can reduce a known working set but also creates load; an uncontrolled scan is another stampede.')+
p('Inject a lost cache, a slow cache and a partially recovered cache as different failures. A slow cache consumes deadline before the source fallback even starts. Inspect time spent acquiring cache connections, waiting on Redis and waiting on source admission. Ensure one request cannot retain both scarce resources indefinitely. On recovery, ramp fills and observe useful completions rather than celebrating hit ratio while accepted orders are stalled.')+
qa([['Advanced','What proves a cache-outage plan works?','The source stays within its validated operating budget, critical invariants hold, optional work follows its documented degradation policy and recovery age remains bounded under a cold-cache drill. A successful Redis reconnect or high hit ratio afterward is not enough.']])+
refs([['https://redis.io/docs/latest/operate/oss_and_stack/management/replication/','Redis replication','acknowledgement, replication and failover limitations.']]))}
];
