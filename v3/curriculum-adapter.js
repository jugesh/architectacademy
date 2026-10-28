/* Navigation is authoritative. Authored notes may add depth, never alter its labels or order. */
(() => {
 const mapping={
 'what-is-system-design-interview':'start','system-design-interview-template':'design-review',
 'non-functional-requirements':'requirements','back-of-envelope-calculation':'estimation',
 'api-design-intro':'api-design','api-design-pagination':'pagination','timeout':'timeouts',
 'retries':'retries','idempotency':'idempotency','circuit-breaker':'circuit-breakers',
 'message-queue':'queues','introduction-to-kafka':'kafka',
 'evolution-of-a-web-app':'horizontal-scaling','load-balancer':'load-balancing',
 'caching-mental-model':'caching','cache-consistency':'cache-consistency',
 'sql-vs-nosql':'sql-nosql','database-replication':'replication','database-partitioning':'partitioning',
 'batch-and-stream-processing':'batch-stream','event-time-watermarks':'event-time','saga-pattern':'sagas'
 };
 const authored=new Map(window.ACADEMY_AUTHORED_NOTES.map(l=>[l.id,l]));
 window.ACADEMY_LEGACY_ROUTES=Object.fromEntries(Object.entries(mapping).map(([next,old])=>[old,next]));
 window.ACADEMY_LEGACY_ROUTES.outbox='multi-system-data-sync';
 window.ACADEMY_LEGACY_ROUTES.indexes='sql-database';
 window.ACADEMY_LEGACY_ROUTES.transactions='sql-database';
 window.ACADEMY_GROUPS=window.ACADEMY_CURRICULUM.map(g=>[g.title,g.sections.map(s=>[s.title,s.lessons.map(l=>l.id)])]);
 window.ACADEMY_LESSONS=window.ACADEMY_CURRICULUM.flatMap(g=>g.sections.flatMap(s=>s.lessons.map(topic=>{
  const existing=authored.get(mapping[topic.id]);
  if(existing)return {...existing,id:topic.id,title:topic.title,depth:topic.id==='idempotency'?'guided':'notes'};
  const note=window.ACADEMY_TOPIC_NOTES[topic.id];
  if(!note)throw new Error('Missing original notes for '+topic.id);
  return {id:topic.id,title:topic.title,depth:'brief',kicker:note[0],problem:note[1],model:note[2],
   steps:note[3],tradeoff:note[4],question:note[5],answer:note[6],takeaway:note[7]};
 })));
})();
