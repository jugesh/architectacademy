(() => {
'use strict';
const definitions = {
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
};
const keys=Object.keys(definitions).sort((a,b)=>b.length-a.length);
const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp('(?<![\\p{L}\\p{N}_])('+keys.map(escapeRe).join('|')+')(?![\\p{L}\\p{N}_])','giu');
const canonical=new Map(keys.map(k=>[k.toLocaleLowerCase(),k]));
let active=null;
function close(){if(active){active.setAttribute('aria-expanded','false');active=null;}}
function decorate(root){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
  const p=n.parentElement;if(!p||!n.nodeValue.trim()||p.closest('a,button,summary,code,pre,script,style,textarea,.term,[data-no-tooltips]'))return NodeFilter.FILTER_REJECT;
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
 el.setAttribute('aria-label',key+': '+el.dataset.definition);
 el.addEventListener('click',e=>{e.stopPropagation();const isOpen=active===el;close();if(!isOpen){active=el;el.setAttribute('aria-expanded','true');el.focus();}});
 el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}if(e.key==='Escape')close();});
});
document.addEventListener('click',e=>{if(!e.target.closest('.term'))close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
window.setBookMode=function(mode){close();document.body.classList.remove('cornell','revision');if(mode!=='textbook')document.body.classList.add(mode);document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));};
window.printBook=function(){close();const entries=[...document.querySelectorAll('details')],state=entries.map(e=>e.open);entries.forEach(e=>e.open=true);const restore=()=>{entries.forEach((e,i)=>e.open=state[i]);window.removeEventListener('afterprint',restore);};window.addEventListener('afterprint',restore);window.print();};
window.setBookMode('textbook');
})();