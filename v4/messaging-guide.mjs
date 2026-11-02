import {p,code,table,qa,refs,section,diagram,warn} from './lesson-helpers.mjs';
export function guideMessaging(lessons){
 const lesson=lessons.find(l=>l.slug==='messaging');if(!lesson)throw Error('Missing messaging lesson');
 const replace=(id,html,title,cue)=>{const s=lesson.sections.find(s=>s.id===id);if(!s)throw Error(`Missing messaging section ${id}`);s.html=html;if(title)s.title=title;if(cue)s.cue=cue;};
 const add=(after,entry)=>{const i=lesson.sections.findIndex(s=>s.id===after);if(i<0||lesson.sections.some(s=>s.id===entry.id))throw Error(`Invalid messaging guide anchor ${entry.id}`);lesson.sections.splice(i+1,0,{...entry,html:`<div class="guided-messaging">${entry.html}</div>`});};
 lesson.intro='Follow one paid order from an API to a background worker. Learn the words first, trace successful delivery, then add crash recovery, duplicates, queues, Kafka, retries and replay one step at a time.';
 lesson.definition='Messaging lets one component send a request or fact for another component to handle separately. A broker carries/retains messages under its contract; the application still defines what successful business processing means.';
 lesson.prerequisites='Know what an HTTP request and a database commit are. No Kafka or SQS knowledge is assumed. If local transactions are new, read <a href="databases.html#transactions">what a transaction protects</a> first.';
 lesson.outcome='Explain producer, broker and consumer in plain language; choose a queue or retained log from reader needs; and defend one order workflow through duplicate delivery, crashes and recovery.';
 replace('problem',
 p('Alice buys a mug. Order O7 is paid, and the shop must prepare one parcel. Alice should not have to keep the checkout connection open while a warehouse worker packs it. We want to accept the order now and finish the packing work later. For this running example, assume payment is already confirmed; recovering an unknown payment is a separate problem in the <a href="reliability.html#payment-recovery">Reliability lesson</a>.')+
 p('Think of a restaurant order ticket. The counter records the accepted order, then a kitchen worker picks up the ticket. The customer and cook do not need to remain in the same conversation. The analogy explains the handoff, but a computer needs something a paper-ticket picture hides: a record that survives a crash, a way to recognize copied tickets and a rule for when a ticket may be considered finished.')+
 p('A background Java thread changes when work happens, but the thread disappears if its process dies. A durable message or pending-work record lets another process continue. This buys time independence; it does not make work instant or guarantee success. A paid order left waiting forever is still a customer failure.')+
 `<div class="callout"><strong>Read in two passes.</strong><p>First pass: <a href="#message-basics">learn the words</a>, <a href="#walkthrough">follow O7</a>, compare <a href="#queue-log-worked">queue and log readers</a>, then understand <a href="#ack">acknowledgement</a> and <a href="#outbox">the outbox</a>.</p><p>Second pass: study the <a href="#relay-protocol">relay SQL</a>, <a href="#consumer-transaction">consumer transaction</a>, <a href="#partition-recovery">offset recovery</a>, <a href="#retry-workbook">retry decisions</a> and <a href="#schema-evolution">compatible replay</a>.</p></div>`,
 'Start with one order','Keep order O7 and event E91 in mind throughout the lesson.');
 add('problem',section('message-basics','Learn the five words',
 p('A message is a small envelope of data. In our example it says that order O7 was paid. The order service creates the message; another service uses it to prepare fulfillment work. Start with the five words below before choosing a product.')+
 table(['Word','Plain meaning','O7 example'],[['Producer','The component that sends the message','Order service.'],['Broker','The service that accepts and makes messages available under its storage/delivery contract','A selected SQS queue or Kafka deployment.'],['Consumer','The component that reads and handles the message','Fulfillment worker.'],['Acknowledgement (ack)','A confirmation about a particular step; its scope must be stated','Producer send accepted, or consumer processing acknowledged. These are different confirmations.'],['Redelivery','The same logical message is made available again','E91 is received again after a lost acknowledgement or worker failure.']])+
 diagram(['Order service<br>producer','Broker<br>retained message','Fulfillment worker<br>consumer'],'This is a handoff path, not one transaction spanning all three components.')+
 code(`{
  "eventId": "E91",
  "eventType": "OrderPaid",
  "schemaVersion": 1,
  "tenantId": "T7",
  "orderId": "O7"
}`)+
 p('The identifiers here are readable placeholders. eventId identifies this recorded fact; orderId identifies the order it concerns. Retrying publication of E91 keeps E91. A later refund of O7 is a different fact and needs a different event identity. Do not use one new random event ID for every retry, or one event ID for every event in the order’s whole life.')+
 p('A <strong>command</strong> requests an action, such as PrepareParcel. An <strong>event</strong> reports a fact, such as OrderPaid. Several independent services can react to one fact, but each owns its reaction. Naming something an event does not make its payload trustworthy: authenticate the producer path, validate the schema and authorize tenant/resource access in the consumer.')+
 p('<strong>Synchronous</strong> means the caller waits for the chosen result in that interaction. <strong>Asynchronous</strong> means completion can happen separately. The API still needs to say what its response proves: “order accepted” is different from “parcel prepared.” Provide a durable status identity rather than implying all work is complete because the HTTP handler returned.')+
 qa([['Foundational','Is the broker the code that packs the parcel?','No. The broker carries/retains the message under its contract. The consumer runs the business handler. Keeping those roles separate helps identify whether a failure is publication, delivery or processing.'],['Foundational','Is a message ID the same as an order ID?','No. One order can have many distinct events. Keep a stable event ID across repeats of the same fact, and a stable order ID across the order lifecycle.']])));
 replace('reasoning-path',
 p('Use three questions whenever someone says “the message succeeded.” First, did the sender get evidence that the broker accepted it? Second, did a consumer receive it? Third, did the required business work commit or reach its explicitly defined completion boundary? These answers can differ.')+
 table(['Observation','What it can tell us','What it cannot tell us alone'],[['Send acknowledgement','The broker accepted the send according to its configured contract','The fulfillment consumer committed.'],['Consumer received E91','A handler has a delivery to inspect','The handler finished or a parcel exists.'],['Local fulfillment task committed','Recoverable local work now exists','A remote warehouse has completed the shipment.'],['Consumer ack / offset commit','The consumer reports progress to the broker','Any arbitrary external effect is part of that same transaction.']])+
 p('We will first protect a local database effect: create one fulfillment task for O7. Later, a separate worker may call a warehouse API. That remote call has another failure boundary. Do not start by trying to guarantee every possible side effect at once; name the current effect and the durable evidence that proves it.')+
 qa([['Foundational','The send call succeeded. Is O7 packed?','No. It tells you about the sender/broker boundary, according to the actual send contract. The consumer may not have received or processed E91 yet.'],['Intermediate','Why do we expect redelivery instead of treating it as an impossible error?','A consumer can commit useful work and crash before the broker sees its acknowledgement. Redelivery recovers uncertain progress, so the consumer must recognize and safely handle repeats.']]),
 'Separate delivery from completion','Ask what each confirmation actually proves.');
 replace('walkthrough',
 p('Here is the successful O7 path before introducing the failure fixes. The order service records the paid order and the need to notify fulfillment. A sender publishes E91. A fulfillment worker receives E91 and creates a local task. Only after that task is durably recorded does it report the delivery as processed.')+
 table(['Step','What happens','Evidence after the step'],[['1','Commit O7 and pending event E91 locally','Order and pending publication survive a process restart.'],['2','Publish E91 and observe broker acceptance','The broker has accepted the event under its contract.'],['3','Fulfillment receives E91','A delivery attempt exists; no effect is yet proved.'],['4','Commit receipt for E91 and fulfillment task together','A repeat can be recognized without another task.'],['5','Acknowledge/delete or commit the permitted consumed position','The broker can apply its progress/redelivery rules.']])+
 p('The pending publication in step 1 is called an <strong>outbox</strong>. The consumer’s durable “I applied E91” receipt in step 4 is often called an <strong>inbox</strong> or deduplication receipt. Those names describe two small records on opposite sides of the handoff. The later SQL sections implement them; first understand why each record exists.')+
 p('Now remove power after each step. Before step 1 commits, no accepted fact should escape. After step 1 but before step 2, the pending event needs a sender that can resume. After step 4 but before step 5, the broker may deliver E91 again. We cannot make those gaps disappear by calling a method “reliable”; we need an explicit recovery action for each.')+
 p('Notice what we have not claimed: one local fulfillment task is not the same as one completed remote shipment. If a warehouse accepts the task and its response disappears, the runner needs the original warehouse operation identity and an inquiry/reconciliation policy. The <a href="#worked">complete fulfillment design</a> returns to that harder boundary.'),
 'Follow O7 through five steps','First the happy path; then stop the process between steps.');
 replace('models',
 p('Choose the delivery model from how readers must behave. For one pool of workers sharing packing jobs, use a work-queue model. For fulfillment and analytics to react independently, give them independent delivery/progress. For consumers that must reread retained history, a log model is useful. These are requirements before they are product names.')+
 table(['Model','Reader behavior','Question to ask'],[['Work queue','Competing workers share pending jobs','Which durable effect permits acknowledging/removing a job?'],['Publish/subscribe','Independent subscribers each get their own reaction path','Does each subscriber have independent retries and recovery?'],['Retained partitioned log','Readers track positions while history remains retained','What ordering, replay and retention scope is required?']])+
 p('Kafka supplies a partitioned log and independent consumer-group progress. SQS supplies queue behavior with different standard/FIFO contracts. Products add more capabilities than this introductory table shows; choose the exact service mode and client configuration. The next section makes reader behavior concrete using only E91 and two fulfillment workers.'),
 'Choose the reader model','A queue shares work; independent subscribers share facts, not one completion cursor.');
 add('models',section('queue-log-worked','Two workers, two reader models',
 p('Imagine E91, E92 and E93 represent three paid orders. Fulfillment has workers F1 and F2. We want the workers to share the work, while an analytics service separately counts all three orders. “Add another consumer” can mean a competing worker or another independent reader; confusing them can make analytics steal fulfillment work.')+
 table(['Setup','F1/F2 behavior','Analytics behavior'],[['One work queue for fulfillment','Workers compete for deliveries; repeats remain possible','Needs its own subscription/queue/path for an independent reaction.'],['Kafka: F1/F2 in the same fulfillment group','Assigned partitions divide progress among the group','A separate analytics group reads its own copy of the retained history.'],['Kafka: F1 and F2 in different groups','Each group independently reads the records','This is not load sharing for one fulfillment reaction.']])+
 code(`Illustrative Kafka topic: order-events
  partition 0: offset 10 = E91(order O7), offset 11 = E93(order O9)
  partition 1: offset 20 = E92(order O8)

Consumer group fulfillment:
  F1 assigned partition 0; F2 assigned partition 1
Consumer group analytics:
  A1 has its OWN positions for partitions 0 and 1

An offset is a position within one partition.
Offset 20 in partition 1 is not globally "after" offset 11 in partition 0.`)+
 p('With this two-partition illustration, adding a third fulfillment member does not create a third partition to own. Actual assignment depends on the configured assignor and subscriptions. More partitions can help parallelize different keys, but do not split an inherently ordered single key’s effect safely without a different domain protocol.')+
 p('Kafka progress and retention are separate. A consumer group advancing past E91 does not itself delete E91 from the topic; retention/compaction policies govern what history remains. A new analytics group can read older retained records under its configured start behavior. A queue job that was deleted is not automatically available for a future independent subscriber: plan retained source/archive or another delivery path if historical replay is required.')+
 p('Ordering is smaller than “the system.” Kafka orders records within a partition. Two records in that order can still finish in the opposite order if the application offloads them concurrently. SQS standard queues can redeliver and do not promise strict order; FIFO has specific message-group/order/deduplication rules, which still do not atomically commit a warehouse HTTP effect. Draw the exact scope before claiming order or exactly once.')+
 qa([['Intermediate','Why did F1 and F2 each create a task for every event after we gave them different group IDs?','They became independent Kafka reader groups, not two workers sharing one group’s assigned work. Use the intended grouping and still protect the local business effect from repeats.'],['Foundational','If analytics crashes, should fulfillment stop?','Not inherently. Independent progress lets analytics catch up from its allowed retained source while fulfillment continues, subject to shared broker/dependency capacity and the business contract.']])+
 refs([['https://kafka.apache.org/40/design/design/','Kafka design','partitioned logs, reader progress and delivery scope.'],['https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html','SQS redelivery','why consumers still need repeat-safe effects.']])));
 replace('ack',
 p('Acknowledging too early can lose work; acknowledging after a durable commit can cause a repeat. Compare two attempts to create one local task for E91. The “safe” column is safe only when the receipt and effect truly share the same local commit and the duplicate branch is implemented correctly.')+
 table(['Crash moment','Ack first, then database','Database commit first, then ack'],[['Before database work','Broker may already stop redelivering; task missing','No ack yet, so redelivery can retry.'],['After local commit, before ack','This gap was skipped by the unsafe ordering','Task exists; repeat must recognize E91.'],['On repeat','Cannot recover a message already discarded without another ledger','Receipt finds completed local work; skip another task and acknowledge.']])+
 code(`Conceptual consumer protocol:
  begin local transaction
  try to insert receipt keyed by (consumerName, eventId)
  if an existing COMPLETED receipt matches the original event:
      do not apply the same local effect again
  else:
      create the fulfillment task / allowed state transition
      record the receipt in THIS transaction
  commit
  only then acknowledge the delivery / safe contiguous position

If local work fails, roll back the receipt with it.
A separately committed "seen" flag is not proof the effect completed.`)+
 p('<strong>Idempotent processing</strong> means repeating the same logical operation does not repeat its protected effect. Here we achieve it with stable identity and a database uniqueness/transaction protocol, not by assuming only one delivery arrives. Scope receipts by the intended consumer: analytics must be allowed to process E91 even after fulfillment did.')+
 p('Retain the receipt for the supported redelivery/replay horizon or preserve equivalent durable business uniqueness. Deleting it after a day makes a two-day-old replay potentially new again. If one event ID arrives with different content, treat that as a contract conflict instead of silently applying the changed event.')+
 p('The <a href="#consumer-transaction">consumer SQL section</a> adds hash comparison and state/version conditions. For now, remember the reason for the ordering: a repeat is repairable when durable identity tells us what committed; missing work after premature ack may have no remaining trigger.'),
 'Ack only after durable work','Use one database effect first; add external providers later.');
 replace('outbox',
 p('The sender has a similar two-step problem. It needs both a committed order and a message. If it commits the order first, it can crash before sending. If it sends first, it can later roll back the order. Writing to two independent systems is often called a <strong>dual write</strong>. Merely placing the two Java calls next to each other does not make them atomic.')+
 table(['Attempt','Failure','Wrong outcome'],[['Commit order, then send','Crash before send','Paid order has no recoverable fulfillment notification.'],['Send, then commit order','Order transaction rolls back','Consumer sees a fact that never became true locally.'],['Commit order + outbox together','Crash before relay send','A durable pending event remains to be sent.']])+
 code(`// Application orchestration outline; repositories use one DB/manager.
// Call this through the managed transaction boundary.
@Transactional
public Order recordPaidOrder(ConfirmedOrder command) {
  Order order = orders.recordPaid(command); // stable command identity
  outbox.insert(eventWithStableId("E91", "OrderPaid", order.id()));
  return order;
}
// E91 is a readable example ID, not a constant for ALL orders.
// Successful outward response depends on the actual commit outcome.
// A separate relay sends committed outbox records.`)+
 p('An <strong>outbox</strong> is a local table of messages that still need publication. A <strong>relay</strong> is a worker that publishes those committed records. Committing order and outbox in one database transaction means both exist or neither does. It does not make the later broker send part of that same transaction.')+
 p('The relay can send E91 successfully, crash before marking it published and send it again after restart. That is why the consumer protocol already learned to recognize E91. An outbox trades an unrecorded lost notification for recoverable, potentially repeated publication. It is a good fit when the business change and intent really can share a local atomic boundary.')+
 p('An after-commit callback without durable intent still has a crash gap. If the relay reconstructs an old event from mutable current data, it can also change what E91 means. Store the intended event representation or a carefully versioned reconstruction rule. The <a href="#relay-protocol">relay SQL</a> then adds bounded claims, acknowledgement handling and stale-worker protection.'),
 'Record the message with the order','Outbox = durable intent; relay = recoverable sender.');
 add('ordering',section('schema-evolution','Change events without breaking readers',
 p('Messages can outlive a deployment. Version 2 of the producer may run while a version 1 consumer is still processing yesterday’s events. A reader also meets old schemas during replay. Compatibility is therefore a relationship among retained records, overlapping processes and the actions each reader can safely take—not just whether today’s JSON deserializes.')+
 code(`Earlier event, schema version 1:
{"eventId":"E91","eventType":"OrderPaid","schemaVersion":1,
 "tenantId":"T7","orderId":"O7"}

Compatible optional extension, ONLY if readers tolerate unknown fields
and the new field really is optional for their business decision:
{"eventId":"E94","eventType":"OrderPaid","schemaVersion":1,
 "tenantId":"T7","orderId":"O10","salesChannel":"WEB"}

Potential breaking change:
rename orderId to purchaseId, change amount units, or change the
meaning of OrderPaid from "captured" to "authorization requested".`)+
 p('A field addition is not universally safe. A strict reader can reject unknown fields, a schema registry has its own configured compatibility checks, and an old reader cannot enforce a newly required business rule merely by ignoring a field. Test semantic behavior as well as serialization. Never silently change an immutable E91 payload and republish it under E91’s identity to “upgrade history.”')+
 table(['Change','Reader question','Controlled migration'],[['Optional display field','Can old readers ignore it without changing their decision?','Test old/new producer-reader combinations.'],['New required decision input','What should old readers do when they lack it?','Deploy compatible readers before enabling writers; define absence behavior.'],['Renamed/type-changed field','Can retained history still be interpreted?','Version the contract and use an explicit adapter/upcaster if appropriate.'],['New event type','Ignore, reject or quarantine under which policy?','Make unknown-type handling and ownership visible.']])+
 p('An upcaster translates a historical representation into the internal model a current reader uses. It should preserve the original fact’s meaning and identity, not invent missing business evidence. If an old event lacks a required value, choose an explicit lookup, legacy rule or unresolved path. Filling in a convenient current price can rewrite historical meaning.')+
 p('Replay also needs an effect policy. Rebuilding a revenue/search projection may intentionally reprocess history while suppressing email, shipment and payment effects. A normal inbox receipt can skip events already applied to the old projection, so a rebuild may need a new projection generation or an isolated target with its own progress/receipt scope. That does not authorize a new shipment consumer identity to repeat irreversible work.')+
 p('Before switching to the rebuilt projection, connect the baseline to a known source position, handle concurrent changes/deletes, compare critical facts and expose the intended freshness. Rewinding a Kafka offset supplies retained input; it does not by itself prove the new output is complete or correct.')+
 qa([['Advanced','Can a schema registry prove the new event means the same business fact?','No. Its configured structural compatibility rules are useful evidence, but units, state meaning, authorization context and allowed effects still require domain tests and a migration policy.'],['Intermediate','Why does a projection rebuild sometimes use a new receipt scope?','The new target needs to apply historical events even if the old target already did. Isolate the new projection generation and its effects; do not bypass deduplication for unrelated external operations.']])));
 add('implementation',section('retry-workbook','Decide what to retry',
 p('The worker cannot treat every failure as “try again now.” A temporary connection problem, malformed message and unknown warehouse outcome have different remedies. Start with E91’s intended local effect and classify the evidence before selecting backoff, quarantine or inquiry.')+
 table(['Failure','Meaning','Next action'],[['Database temporarily unavailable before local commit','No completed local effect yet','Bounded retry with backoff/jitter and a deadline/load budget.'],['Receipt already completed for E91','The protected local effect already committed','Verify identity/content; acknowledge without another task.'],['Unknown schema or invalid required data','Repeating the same reader/input may fail deterministically','Preserve diagnostics and apply a controlled quarantine/fix policy.'],['Warehouse accepted but response disappeared','Remote effect may already exist','Inquire/reconcile the same shipment identity; no fresh-key shipment.'],['Current ownership was revoked','This worker must not declare new progress casually','Follow the supported handoff/ownership protocol.']])+
 code(`Illustrative retry timing, NOT service defaults:
  attempt 1 fails transiently
  wait a jittered interval near 1 second
  attempt 2 fails transiently
  wait a jittered interval near 2 seconds
  attempt 3 still fails
  stop/park under the declared policy; preserve E91 and its evidence

Every repeat must fit the remaining completion and resource budgets.
A deterministic schema error is not repaired by these delays.`)+
 p('Jitter varies wait times so many workers do not retry in lockstep. It does not add downstream capacity. If 100 deliveries each get three total attempts, up to 300 handler attempts can reach the dependency; SDK and client retry layers can multiply that further. Count useful completed effects separately from delivery/attempt counts.')+
 p('A <strong>dead-letter queue (DLQ)</strong> or quarantine stores work the normal path could not finish. It needs the original identity/payload or a secure recoverable reference, classified error, schema/reader version, attempt history and an owner. Moving E91 there is not fulfillment. A paid order’s unresolved age still matters even if the primary queue becomes empty.')+
 p('Ordering changes the retry decision. If O7’s version 8 failed and version 9 depends on it, sending 8 to a delayed retry path can let 9 overtake it. Pause the relevant ordered scope, park dependent work durably, or use a domain transition that safely handles the gap. “Use a retry topic” describes transport; it does not decide which business state transitions are legal.')+
 table(['Recovery gate','Evidence'],[['Reader fixed','Representative old/new payloads and the failing case now behave as intended.'],['Replay authorized','Explicit cohort, target consumer/generation and stop conditions.'],['Identity preserved','Original event/business references retained; recovery attempt identified separately.'],['Effect reconciled','Applied, already applied, rejected and still unresolved outcomes accounted for.']])+
 p('For SQS, ensure the visibility policy and any extensions fit the real processing duration, while retaining repeat safety if visibility expires or duplicates occur. For Kafka, commit only the safe contiguous progress described in <a href="#partition-recovery">offset recovery</a>. In both cases, a local committed effect followed by a failed acknowledgement is a repeat-recognition case, not a reason to execute the effect again.')+
 qa([['Intermediate','Should the consumer acknowledge a poison event just to unblock the queue?','Only after the business contract permits a terminal decision or a durable, owned recovery handoff. Dropping it with no recovery evidence can lose accepted work, and later same-key events may still depend on it.'],['Advanced','How do we prove replay recovered the incident?','Reconcile the original affected cohort to allowed business outcomes without duplicate effects, then verify unresolved age, useful throughput and resource budgets. A falling DLQ count alone is not proof.']])+
 refs([['https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html','SQS visibility','bounded delivery visibility and repeat-safe processing.']])));
 const bridges={
  'relay-protocol':'Before the SQL: imagine the relay putting a temporary “I am sending E91” label on a pending row. If it dies, another sender must be able to recover that row. The lease/epoch below coordinates that claim; it still cannot make a network send and a database marker one atomic action.',
  'consumer-transaction':'Before the SQL: the consumer needs a receipt that means “my local E91 effect committed,” not merely “I saw E91.” Put that receipt and the task in the same database commit. The SQL below adds the concurrent-duplicate and stale-state checks.',
  'partition-recovery':'Before the offset arithmetic: a bookmark must not move beyond a page of unfinished work. If offset 250 is unfinished, finishing 251 does not make it safe to resume from 252 after a crash. Follow the two records below and keep the partition identity attached.',
  'backlog-workbook':'Before the calculation: a queue drains only with capacity left after new arrivals. If workers finish 800 jobs/s while 600 new jobs/s arrive, only 200 jobs/s reduce the old backlog. Use useful completed jobs, not repeated delivery attempts.'
 };
 for(const [id,text]of Object.entries(bridges)){const s=lesson.sections.find(s=>s.id===id);if(!s)throw Error(`Missing advanced messaging bridge ${id}`);s.html=`<div class="callout"><strong>In plain language.</strong> ${text}</div>`+s.html;}
 replace('pitfalls',
 p('A queue buys time only if useful completion can catch up within the business deadline. If new accepted jobs arrive faster than sustainable processing, the backlog grows even when HTTP acceptance remains fast. The <a href="#backlog-workbook">backlog workbook</a> calculates the recovery budget; distinguish arrivals, delivery attempts and useful completed effects.')+
 p('“Exactly once” always needs a scope. A supported broker transaction may coordinate selected broker operations, not an arbitrary database, email provider and warehouse together. For every claim, name the participating resources, stable identity, durable evidence and recovery action. Keep critical fulfillment capacity separate from optional analytics or receipt delivery where their failure budgets differ.')+
 table(['Ask before release','What a defensible answer contains'],[['What survives a crash?','Order/outbox, consumer receipt/effect and remote intent under their actual commit boundaries.'],['What may repeat?','Publication, delivery, callbacks and recovery attempts, with identities preserved.'],['Who owns unresolved work?','An observable durable state, age bound and authorized recovery path.'],['What if the queue shrinks?','Verify useful business completion rather than assuming deletion, expiry or quarantine is success.']]),
 'Check the whole recovery path','Queue health and customer completion are different measurements.');
}
