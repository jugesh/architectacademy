(() => {
'use strict';
const definitions = {
'DNS':'Domain Name System: resolves names to records such as candidate IP addresses; it does not migrate existing connections.',
'TCP':'Transmission Control Protocol: reliable ordered byte-stream transport with flow and congestion control.',
'TLS':'Transport Layer Security: protects transport confidentiality and integrity, with peer authentication when properly verified.',
'QUIC':'Secure transport over UDP with multiplexed streams, used by HTTP/3.',
'ALPN':'Application-Layer Protocol Negotiation: TLS extension used to negotiate an application protocol.',
'SNI':'Server Name Indication: TLS extension identifying the requested hostname for server configuration selection.',
'ETag':'Entity tag: opaque representation validator used for cache validation and conditional requests.',
'If-Match':'HTTP precondition requiring a matching current representation validator before applying the method.',
'CORS':'Cross-Origin Resource Sharing: browser rules governing cross-origin script access; not API authorization.',
'CDN':'Content Delivery Network: distributed intermediaries for content delivery and, where configured, caching.',
'head-of-line blocking':'Waiting caused when earlier unavailable work prevents later otherwise-ready work from progressing.',

'p99':'99th-percentile latency: 99% of requests complete at or below this duration.',
'p95':'95th-percentile latency: 95% of requests complete at or below this duration.',
'RPS':'Requests per second: a measure of request arrival or completion rate.',
'latency':'Time elapsed from the start of an operation until its result is observed.',
'throughput':'Amount of successfully completed work per unit time.',
'stateless':'A service instance does not require its own persistent client-session state to handle a subsequent request.',
'Little’s Law':'L = λ × W for a stable system: average work in progress equals arrival rate times average time in system.',
'ECS':'Amazon Elastic Container Service: AWS managed container orchestration.',
'ALB':'Application Load Balancer: AWS Layer 7 HTTP/HTTPS load balancer.',
'SQS':'Amazon Simple Queue Service: AWS managed messaging queue.',
'JVM':'Java Virtual Machine: runtime executing Java bytecode, with managed memory and JIT compilation.',
'heap':'Memory area used to allocate most Java objects.',
'RSS':'Resident Set Size: memory pages of a process currently resident in physical memory.',
'GC':'Garbage collection: reclaiming memory occupied by objects no longer reachable.',
'G1':'Garbage-First collector: region-based JVM garbage collector balancing throughput and pause targets.',
'ZGC':'Z Garbage Collector: low-pause JVM garbage collector with concurrent work.',
'JFR':'Java Flight Recorder: low-overhead JVM profiling and diagnostic event recording.',
'TLAB':'Thread-Local Allocation Buffer: a thread-owned region for fast object allocation.',
'metaspace':'Native-memory area where HotSpot stores class metadata.',
'@Transactional':'Spring annotation declaring transactional behavior, typically applied by proxy interception.',
'optimistic locking':'Concurrency control that detects conflicting updates, often with a version column.',
'isolation':'Database transaction guarantee defining which concurrent effects may be observed.',
'ACID':'Atomicity, Consistency, Isolation and Durability: core database transaction properties.',
'MVCC':'Multi-Version Concurrency Control: maintaining row versions to support concurrent reads and writes.',
'B-tree':'Balanced search-tree structure commonly used for database indexes.',
'keyset pagination':'Pagination using the previous page’s ordered key values instead of a deep OFFSET.',
'idempotency':'Property that repeating a logical operation does not change its intended effect after the first success.',
'Idempotency-Key':'Client-supplied logical operation identifier used to deduplicate safe retries.',
'TTL':'Time to live: duration after which cached or stored information expires.',
'CAS':'Compare-and-set: conditional update performed only when an expected value or version matches.',
'cache-aside':'Application-managed caching: read cache first, load from source on miss and invalidate on write.',
'cache stampede':'Many requests simultaneously miss or expire a hot cache entry and overwhelm the origin.',
'Kafka':'Distributed append-only event log with partitioned topics and consumer groups.',
'partition':'Ordered subdivision of a Kafka topic; ordering is guaranteed within one partition.',
'consumer group':'Kafka consumers coordinating partition ownership and offsets for one logical subscription.',
'offset':'Position of a record within a Kafka partition.',
'rebalance':'Redistribution of Kafka partition assignments when group membership or topology changes.',
'DLQ':'Dead-letter queue: destination for messages that cannot be processed under normal retry policy.',
'outbox':'Transactional outbox: durable events written in the same database transaction as business state.',
'circuit breaker':'Resilience pattern that temporarily blocks calls to a failing dependency.',
'bulkhead':'Resilience pattern isolating resource pools or limiting concurrency across dependencies.',
'backoff':'Delay strategy between retries, often exponential and combined with jitter.',
'jitter':'Randomized delay that prevents many clients from retrying in lockstep.',
'deadline':'Absolute latest time by which a request or operation must complete.',
'load shedding':'Rejecting or dropping excess work early to preserve system stability.',
'write skew':'Transaction anomaly where concurrent writes to different rows violate a shared invariant.',
'deadlock':'Cycle of resource waits in which no participant can proceed without intervention.'
,
'ADR':'Architecture Decision Record: a versioned account of context, alternatives, decision, consequences and revisit triggers.',
'SLI':'Service Level Indicator: measured outcome such as the fraction of eligible requests completed correctly under a latency bound.',
'SLO':'Service Level Objective: a target for an SLI over a specified measurement window.',
'SLA':'Service Level Agreement: a contractual service commitment with defined terms and consequences.',
'RPO':'Recovery Point Objective: maximum acceptable data loss expressed as elapsed time or a comparable loss bound.',
'RTO':'Recovery Time Objective: target elapsed time for restoring useful service after a failure.',
'C4':'Software architecture visualization approach using Context, Containers, Components and Code views.',
'CQRS':'Command Query Responsibility Segregation: separating models for changing state from models for reading state where justified.',
'bounded context':'Domain-driven design boundary within which a domain model and terminology have consistent meaning.',
'aggregate':'Domain consistency boundary whose invariant updates are coordinated as one logical unit.',
'hexagonal architecture':'Ports-and-adapters style keeping domain logic independent of delivery and persistence technologies.',
'modular monolith':'One deployable application with intentionally enforced internal module and data-ownership boundaries.',
'saga':'Coordination of multiple local transactions with compensating actions rather than a global atomic rollback.',
'compensation':'Business action designed to mitigate or reverse a prior completed step; it may fail and is not necessarily an exact rollback.',
'eventual consistency':'Consistency model in which replicas or projections may temporarily diverge but converge under stated conditions.',
'read-your-writes':'Session consistency guarantee that a client can subsequently observe its own acknowledged changes.',
'failure domain':'Components or resources that can be affected together by one underlying failure.',
'admission control':'Accepting or rejecting work at a resource boundary to prevent overload and unbounded queues.',
'backpressure':'A mechanism preventing a faster producer from overwhelming a slower consumer.',
'error budget':'The allowable number or proportion of bad eligible events under an SLO over a defined window.',
'burn rate':'Speed at which SLO error budget is being consumed relative to the allowed long-run rate.',
'fitness function':'Repeatable, preferably automated test protecting a chosen architecture property as the system evolves.',
'STRIDE':'Threat-modeling checklist for spoofing, tampering, repudiation, information disclosure, denial of service and elevation of privilege.',
'IDOR':'Insecure Direct Object Reference: broken object-level authorization involving user-controlled resource identifiers.',
'transactional outbox':'Pattern storing business state changes and an event record atomically in the same database transaction.',
'p50':'Median or 50th percentile: half of observations are at or below this value.',
'CAP':'Consistency, Availability and Partition tolerance: formal trade-off framing for behavior during a network partition.'
};
// Ambiguous everyday words require explicit data-term markup.
const explicitOnly=new Set(['partition','offset','aggregate','isolation']);
const keys=Object.keys(definitions).filter(k=>!explicitOnly.has(k)).sort((a,b)=>b.length-a.length);
const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp('(?<![\\p{L}\\p{N}_])('+keys.map(escapeRe).join('|')+')(?![\\p{L}\\p{N}_])','giu');
const canonical=new Map(keys.map(k=>[k.toLocaleLowerCase(),k]));
let active=null;
const tooltip=document.createElement('div');
tooltip.id='book-tooltip';tooltip.className='book-tooltip';tooltip.role='tooltip';tooltip.hidden=true;
document.body.append(tooltip);
function close(){
 if(active){active.setAttribute('aria-expanded','false');active.removeAttribute('aria-describedby');active=null;}
 tooltip.hidden=true;
}
function show(el){
 close();active=el;el.setAttribute('aria-expanded','true');el.setAttribute('aria-describedby',tooltip.id);
 tooltip.textContent=el.dataset.definition;tooltip.hidden=false;
 const rect=el.getBoundingClientRect(),box=tooltip.getBoundingClientRect();
 tooltip.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-box.width-8))+'px';
 tooltip.style.top=Math.max(8,Math.min(rect.bottom+8,window.innerHeight-box.height-8))+'px';
}
window.addEventListener('resize',close);
window.addEventListener('scroll',close,true);
function decorate(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
  const p=n.parentElement;if(!p||!n.nodeValue.trim()||p.closest('a,button,summary,code,pre,script,style,textarea,svg,h1,h2,h3,.term,[data-no-tooltips]'))return NodeFilter.FILTER_REJECT;
  return NodeFilter.FILTER_ACCEPT;
 }});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const n of nodes){pattern.lastIndex=0;const value=n.nodeValue;if(!pattern.test(value))continue;pattern.lastIndex=0;
  const frag=document.createDocumentFragment();let pos=0;for(const m of value.matchAll(pattern)){
   frag.append(document.createTextNode(value.slice(pos,m.index)));
   const key=canonical.get(m[0].toLocaleLowerCase())||m[0];
   const span=document.createElement('span');span.className='term';span.tabIndex=0;span.setAttribute('role','button');span.setAttribute('aria-expanded','false');span.setAttribute('aria-label',key+': '+definitions[key]);span.dataset.term=key;span.dataset.definition=definitions[key];span.textContent=m[0];frag.append(span);pos=m.index+m[0].length;
  }frag.append(document.createTextNode(value.slice(pos)));n.replaceWith(frag);
 }
}
document.querySelectorAll('main').forEach(decorate);
document.querySelectorAll('[data-term]').forEach(el=>{
 const key=el.dataset.term;el.classList.add('term');el.tabIndex=0;el.setAttribute('role','button');el.dataset.definition=definitions[key]||el.dataset.definition||key;
 el.setAttribute('aria-label',el.textContent);
 el.setAttribute('aria-expanded','false');
 el.addEventListener('mouseenter',()=>show(el));
 el.addEventListener('mouseleave',close);
 el.addEventListener('focus',()=>show(el));
 el.addEventListener('blur',close);
 el.addEventListener('click',e=>{e.stopPropagation();show(el);});
 el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}if(e.key==='Escape')close();});
});
document.addEventListener('click',e=>{if(!e.target.closest('.term'))close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
window.setBookMode=function(mode){close();document.body.classList.remove('cornell','revision');if(mode!=='textbook')document.body.classList.add(mode);document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));};
let printState=null;
function preparePrint(){
 close();if(printState)return;
 printState=[...document.querySelectorAll('details')].map(el=>[el,el.open]);
 printState.forEach(([el])=>el.open=true);
}
function restorePrint(){
 if(!printState)return;
 printState.forEach(([el,open])=>el.open=open);printState=null;
}
window.addEventListener('beforeprint',preparePrint);
window.addEventListener('afterprint',restorePrint);
window.printBook=function(){preparePrint();window.print();};
window.setBookMode('textbook');
})();