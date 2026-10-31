window.ACADEMY_GLOSSARY = {
 'p50':'The median: about half the measured observations fall at or below this value, for a stated population and window.',
 'p95':'The 95th percentile: about 95% of measured observations fall at or below this value.',
 'p99':'The 99th percentile: about 99% of measured observations fall at or below this value. It is not the maximum.',
 'QPS':'Queries or requests per second. State the operation type and averaging or peak interval.',
 'Little’s Law':'In a stable system, average work in progress L equals arrival rate λ multiplied by average time in the same system W.',
 'latency':'Elapsed time for an operation across a defined boundary, including any waiting inside that boundary.',
 'throughput':'The amount of work completed per unit time, such as successful requests per second.',
 'concurrency':'Work in progress at the same time. It includes waiting operations, not only work using CPU.',
 'tail latency':'The slower end of a latency distribution, often described with percentiles such as p95 or p99.',
 'SLI':'Service-level indicator: a measured quantity used to judge service behavior, such as the fraction of eligible requests that succeed.',
 'SLO':'Service-level objective: a target for a service-level indicator over a specified time window.',
 'error budget':'The amount of bad service permitted by an objective during its measurement window.',
 'invariant':'A correctness rule that must remain true across allowed operations, including concurrent execution and recovery.',
 'idempotent':'Repeating an operation has the same intended effect as performing it once. Identical responses are an additional contract.',
 'idempotency':'A property or protocol that makes repeated attempts converge on the same intended effect within a defined identity and retention boundary.',
 'fingerprint':'A canonical representation or digest of relevant request inputs used to detect conflicting reuse of an operation key.',
 'canonical':'Normalized into an agreed representation so equivalent values can be compared consistently.',
 'deduplication':'Recognizing repeated operation or event identities and preventing an unintended repeated effect.',
 'unique constraint':'A database-enforced rule that rejects conflicting duplicate values for a defined key, including concurrent writers.',
 'atomic':'Indivisible at the stated observation boundary: related changes become visible together or do not commit together.',
 'transaction':'A unit of database work whose atomicity, durability and isolation guarantees depend on the system and configuration.',
 'isolation':'The rules determining which effects concurrent transactions may observe and which anomalies are prevented.',
 'READ COMMITTED':'An isolation level that prevents reads of uncommitted changes; its exact behavior and remaining anomalies vary by database.',
 'deadlock':'A cycle of waiting where transactions hold resources needed by one another. A database commonly aborts a participant to make progress.',
 'serialization':'In transaction concurrency, arranging effects so they correspond to a valid serial execution. This differs from encoding data into bytes.',
 'deadline':'The point after which an operation should no longer spend time or begin more work. Retries consume the same overall budget.',
 'timeout':'A limit on how long one participant waits. It does not prove that a remote operation failed or rolled back.',
 'backoff':'Increasing the delay between repeated attempts to reduce pressure on a struggling dependency.',
 'jitter':'Random variation in retry or scheduling delays that reduces synchronized bursts of traffic.',
 'retry budget':'A bound on additional retry traffic, often relative to original work, to prevent failure amplification.',
 'circuit breaker':'A mechanism that temporarily rejects calls after sufficient failures, then probes whether the dependency has recovered.',
 'bulkhead':'A capacity boundary that isolates one dependency or workload so it cannot consume every shared worker or connection.',
 'admission control':'Accepting or rejecting work before it exhausts a bounded resource such as concurrency, memory or a queue.',
 'backpressure':'A signal or mechanism that slows upstream work when downstream stages cannot keep up.',
 'connection pool':'A bounded set of reusable connections. Waiting for a connection can contribute to request latency and deadline exhaustion.',
 'IN_DOUBT':'An unresolved knowledge state: a remote effect may have occurred, but an authoritative outcome has not yet been established.',
 'reconciliation':'Comparing authoritative evidence and recorded state to identify and safely resolve missing, conflicting or uncertain outcomes.',
 'fencing':'Enforcement of current ownership, often through a generation or token, so a stale participant cannot perform protected work.',
 'lease':'Time-limited ownership. Expiry does not guarantee that a paused former owner has stopped running.',
 'outbox':'A durable publication-intent record written in the same local transaction as business state, then sent by a relay that may retry.',
 'CDC':'Change data capture: reading committed storage changes or a change feed and propagating them to other systems.',
 'saga':'A durable sequence of local operations with explicit recovery and compensating actions across service boundaries.',
 'compensation':'A business operation intended to counteract an earlier effect. It can fail and does not necessarily erase the original history.',
 'at-least-once':'A delivery or processing policy that can repeat work during recovery. Business effects need replay-safe handling.',
 'at-most-once':'A policy that avoids repeated delivery or execution within its boundary but can lose work in some failure windows.',
 'exactly-once':'A guarantee that requires a named boundary for input, state and output. It does not automatically cover unrelated external effects.',
 'acknowledgement':'Evidence of acceptance or progress at a specified boundary, such as a broker receipt or consumer completion signal.',
 'ACK':'An acknowledgement. Its meaning depends on who sends it and what acceptance or completion contract it represents.',
 'offset':'A position within a log or partition. A committed consumer offset records a restart position, not necessarily an atomic external business effect.',
 'partition':'A subset of data or a log assigned to a placement and ordering boundary. Cross-partition guarantees need separate examination.',
 'shard':'A data partition served as a unit of storage or routing. Equal bytes across shards do not imply equal traffic.',
 'hot key':'A key receiving disproportionate traffic. Adding nodes does not automatically split that key’s work.',
 'skew':'An uneven distribution of data or work, such as one tenant dominating requests.',
 'replication':'Maintaining copies of data or a write history on multiple nodes, with explicit acknowledgement, apply and failover policies.',
 'replica':'A maintained copy of another node’s data or history. It can be behind at different receive, persistence or apply positions.',
 'replication lag':'A replica’s delay relative to a defined source progress point. Time lag and log-position lag describe different observations.',
 'failover':'Transferring service or writer authority after failure. It includes routing, eligibility and stale-owner control.',
 'quorum':'A required set or count of participants used for a protocol decision. Correctness depends on intersection, membership and failure assumptions.',
 'TTL':'Time to live: an expiration policy measured from a defined point. It is not automatically a bound on source-data staleness.',
 'cache-aside':'A pattern where the application checks a cache, loads from the source on a miss, and fills the cache for later reads.',
 'cache stampede':'A burst of source loads when many callers miss or refresh the same cached data at once.',
 'request coalescing':'Combining concurrent requests for the same missing value so they share one source load.',
 'eviction':'Removing cached entries to enforce capacity or policy, distinct from expiring entries by age.',
 'LRU':'Least recently used: an eviction strategy that prefers removing entries not accessed recently.',
 'LFU':'Least frequently used: an eviction strategy that considers access frequency, often with aging or approximation.',
 'CDN':'Content delivery network: edge infrastructure that caches or serves eligible content nearer to users.',
 'JWT':'JSON Web Token: a token format. Parsing it does not verify its signature, issuer, audience or intended use.',
 'TLS':'Transport Layer Security: a protocol securing data in transit. Connection setup can consume part of a request deadline.',
 'DNS':'Domain Name System: resolves names to information such as addresses. Cached answers can delay endpoint changes.',
 'cursor':'An opaque or structured continuation position for pagination. It does not grant authorization or imply snapshot consistency.',
 'keyset pagination':'Fetching the next page relative to an ordered key position rather than a changing row offset.',
 'CQRS':'Command Query Responsibility Segregation: separate models for changing state and reading it. It does not require event sourcing.',
 'B-tree':'A balanced multiway ordered search tree. Many database indexes use a B+ tree variant optimized around pages and leaf scans.',
 'B+ tree':'A B-tree-family structure whose records are commonly stored at the leaves, often linked for ordered scans.',
 'SSTable':'Sorted String Table: an immutable sorted key/value file, often paired with block indexes and membership filters.',
 'LSM':'Log-structured merge: a storage approach that buffers updates, flushes sorted runs and merges them through compaction.',
 'Bloom filter':'A probabilistic membership structure that can report definite absence or possible presence under normal assumptions.',
 'compaction':'Background merging or rewriting of storage runs, often to reduce overlap and remove obsolete versions when safe.',
 'tombstone':'A deletion marker retained until the storage or replication protocol can safely remove older versions.',
 'write amplification':'Physical bytes written divided by logical data written, including maintenance such as compaction or index updates.',
 'OLTP':'Online transaction processing: typically short operational reads and updates involving current business state.',
 'OLAP':'Online analytical processing: typically larger scans, historical analysis and aggregations.',
 'watermark':'An estimate of event-time progress used to trigger or clean up stream computations according to a defined policy.',
 'event time':'The timestamp describing when an event happened in its business domain, distinct from when a worker processes it.',
 'checkpoint':'A recoverable progress and state boundary. Its relationship with source positions and output commits determines recovery behavior.',
 'shuffle':'Moving or regrouping records by key between distributed processing stages. It can dominate network and disk cost.',
 'materialized view':'A stored derived result maintained from source data to make reads cheaper. It needs freshness and rebuild rules.',
 'backfill':'Processing a historical input range to populate or correct derived data, with an explicit output and cutover strategy.',
 'ETL':'Extract, transform, load: transform data before loading the target system.',
 'ELT':'Extract, load, transform: load data first and transform it using the target environment.',
 'cardinality':'The number of distinct values, such as keys or time-series label combinations. High cardinality can increase index or state size.',
 'RTO':'Recovery time objective: the target duration for restoring the defined level of service after disruption.',
 'RPO':'Recovery point objective: the target limit on how much data history may be lost after disruption.'
};

window.attachAcademyTooltips = root => {
 const definitions=window.ACADEMY_GLOSSARY;
 const names=Object.keys(definitions).sort((a,b)=>b.length-a.length);
 const lookup=new Map(names.map(name=>[name.toLowerCase(),{name,definition:definitions[name]}]));
 const pattern=new RegExp('\\b('+names.map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','gi');
 const hiddenMode=document.body.classList.contains('revision')?'.full-content':'.revision-content';
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('a,button,code,pre,svg,textarea,h1,h2,h3,summary,.term,.toolbar,.breadcrumb,.lesson-meta,'+hiddenMode)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 const seen=new Set();let sequence=0;
 for(const node of nodes){
  const content=node.textContent;pattern.lastIndex=0;const matches=[...content.matchAll(pattern)];if(!matches.length)continue;
  const fragment=document.createDocumentFragment();let cursor=0;
  for(const match of matches){const key=match[0].toLowerCase();if(seen.has(key))continue;seen.add(key);fragment.append(content.slice(cursor,match.index));
   const term=document.createElement('span');term.className='term';term.tabIndex=0;term.setAttribute('role','button');term.setAttribute('aria-expanded','false');term.setAttribute('aria-label',match[0]+': show definition');term.dataset.term=lookup.get(key).name;term.dataset.definition=lookup.get(key).definition;term.textContent=match[0];term.id='glossary-term-'+(++sequence);fragment.append(term);cursor=match.index+match[0].length;
  }
  if(cursor){fragment.append(content.slice(cursor));node.replaceWith(fragment);}
 }
};

(() => {
 const tooltip=document.createElement('div');tooltip.id='academy-tooltip';tooltip.className='academy-tooltip';tooltip.role='tooltip';tooltip.hidden=true;document.body.append(tooltip);
 let active=null,hideTimer;
 const close=()=>{clearTimeout(hideTimer);if(active){active.setAttribute('aria-expanded','false');active.removeAttribute('aria-describedby');active.dataset.pinned='false';}active=null;tooltip.hidden=true;};
 const position=()=>{if(!active)return;const r=active.getBoundingClientRect(),width=Math.min(320,innerWidth-24);tooltip.style.width=width+'px';tooltip.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';tooltip.style.top='0px';const height=tooltip.offsetHeight;tooltip.style.top=Math.max(12,r.top-height-10>=12?r.top-height-10:Math.min(innerHeight-height-12,r.bottom+10))+'px';};
 const open=term=>{close();active=term;const title=document.createElement('strong');title.textContent=term.dataset.term;const text=document.createElement('span');text.textContent=term.dataset.definition;tooltip.replaceChildren(title,text);tooltip.hidden=false;term.setAttribute('aria-expanded','true');term.setAttribute('aria-describedby',tooltip.id);position();};
 document.addEventListener('pointerover',e=>{const term=e.target.closest('.term');if(term&&e.pointerType!=='touch')open(term);});
 document.addEventListener('pointerout',e=>{if(active&&e.target.closest('.term')===active&&!active.contains(e.relatedTarget)&&!tooltip.contains(e.relatedTarget)&&document.activeElement!==active&&active.dataset.pinned!=='true')hideTimer=setTimeout(close,180);});
 tooltip.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
 tooltip.addEventListener('pointerleave',()=>{if(document.activeElement!==active&&active?.dataset.pinned!=='true')hideTimer=setTimeout(close,180);});
 document.addEventListener('focusin',e=>{const term=e.target.closest('.term');if(term)open(term);else if(active)close();});
 document.addEventListener('click',e=>{const term=e.target.closest('.term');if(term){if(active===term&&term.dataset.pinned==='true'){term.dataset.pinned='false';close();}else{open(term);term.dataset.pinned='true';}}else if(!tooltip.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();return;}const term=e.target.closest('.term');if(term&&(e.key==='Enter'||e.key===' ')){e.preventDefault();term.click();}});
 addEventListener('scroll',()=>{if(!active)return;const r=active.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight){
  // Focus-induced scrolling can temporarily leave the focused term offscreen.
  // Keep its association so subsequent scroll events can restore the bubble.
  if(document.activeElement===active){tooltip.hidden=true;return;}
  close();
 }else{tooltip.hidden=false;position();}},true);addEventListener('resize',close);addEventListener('hashchange',close);addEventListener('beforeprint',close);
 window.closeAcademyTooltip=close;
})();
