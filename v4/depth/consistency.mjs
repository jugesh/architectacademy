import {p,code,table,qa,refs,section,warn} from '../lesson-helpers.mjs';
export const consistencyDepth=[
{after:'models',...section('read-histories','Reason from read histories',
p('A consistency model restricts which observations a system may return. An isolation level restricts concurrent transactions. Their names are not interchangeable. A linearizable single-object register respects completed operations in real time; serializable transactions have an outcome equivalent to some serial transaction order, without that name alone promising real-time order. An application still has to choose the right object/transaction boundary for its invariant.')+
table(['History','Promised model','Assessment'],[['A write of version 8 completes; a later independent read returns 7','Linearizable read of the same register','Violates the completed-write real-time requirement.'],['A session writes 8, then reads its own state as 7','Read-your-writes for that session','Violates the session promise even if other readers may lag.'],['A session reads 8, then reads 7 without an allowed reset','Monotonic reads','Moves backward in the promised session order.'],['Two transactions each use a consistent snapshot but jointly break a set-wide invariant','Snapshot isolation alone','A stable snapshot is not proof of serializability.']])+
p('Read-your-writes is scoped to a defined session/causal chain. Another device or a later request without the required session token may not carry that guarantee automatically. If the product promises that a user sees their order immediately from any device, that is a broader routing/authority requirement. Spell out identity, session lifetime and what happens if the freshness condition cannot be met.')+
code(`Conceptual session freshness protocol:
  write -> acknowledged source position/version v
  next read carries a trusted minimum-observed position v
  selected replica must demonstrate it has applied that position
  otherwise wait within a deadline, route to an eligible authority,
  or report the defined freshness failure

A fixed sleep of 200 ms is not evidence that the replica applied v.
A row's business version may not cover every row used by the query.`)+
p('Positions must be comparable under the actual replication contract. A log position from an old timeline or unrelated shard is not automatically meaningful after promotion or routing changes. An aggregate version can order that aggregate’s changes while saying nothing about a joined account balance. Keep the guarantee’s scope attached to the token instead of treating “version” as a universal freshness number.')+
p('Causal dependence also crosses operations. If a message says “payment completed,” a downstream read that cannot yet observe the associated committed fact may need a causal/freshness protocol or an event representation sufficient for its task. Event arrival is not proof that every independently replicated read model has caught up. Prefer an explicit dependency to a blind retry loop that sometimes returns stale absence.')+
qa([['Advanced','Can a serializable database transaction make a cache-plus-remote-payment workflow linearizable?','No. Its guarantee covers participating database operations under its engine contract. The cache and provider need their own authority, observation and recovery protocols.'],['Intermediate','Does eventual consistency mean any stale answer is acceptable forever?','No. The model and its assumptions still define convergence behavior; the product may additionally require a freshness bound and an operational response when that bound cannot be met.']]))},
{after:'partitions',...section('quorum-boundaries','What quorum arithmetic proves',
p('With three replicas, choosing write acknowledgements W=2 and read responses R=2 gives W+R>N. Every pair of two-member sets intersects. That is a set-intersection statement. It does not by itself define which version wins, how concurrent writes are ordered, whether acknowledged data survives promotion or whether a read repairs conflicting copies.')+
table(['Step','Replica A','Replica B','Replica C'],[['Initial','x=0','x=0','x=0'],['Write v1 acknowledged by A/B','x=v1','x=v1','x=0'],['Read B/C','Not consulted','Returns v1','Returns 0'],['Reader decision','Protocol must choose/resolve a valid result','Intersection supplied one observed copy','Arithmetic did not define resolution']])+
p('This is a deliberately simplified thought experiment, not the implementation of a particular database. A real protocol specifies version ordering, membership, failure assumptions and acknowledgement/read semantics. If a read arbitrarily picks the fastest response, an intersecting response containing newer data can still be ignored. If concurrent writes use incompatible clocks, “largest timestamp” can discard an intended update. Product guarantees must come from the complete protocol, not this equation alone.')+
p('Membership matters. Two quorums chosen from incompatible configurations can lose the intersection property across a poorly controlled reconfiguration. Consensus-based systems use defined configuration-change and leader/term rules to preserve their guarantees. Do not improvise a new replica list during an incident and assume the old arithmetic still applies.')+
code(`Partition decision for an invariant-sensitive write:
  Can this side establish the required authoritative ownership/quorum?
    yes -> accept only under that protocol and acknowledgement policy
    no  -> stop/reject/defer protected writes under the contract

Allowing both sides to accept independent stock decrements does not
preserve one global stock invariant unless the domain/protocol already
allocated disjoint rights that make those writes safe.`)+
p('A timeout is evidence that the caller did not receive a timely answer. It does not distinguish a dead peer from a delayed network, an overloaded process or a committed response that was lost. Promoting another writer merely because one request timed out can leave two actors believing they own the same invariant. Establish ownership and fence stale actors through the supported protocol.')+
p('Some domains can operate on preallocated rights during disconnection. For example, separate regions may each sell from a disjoint inventory allocation, with no region exceeding its assigned rights. This changes the model: unused rights elsewhere may be unavailable locally until safely transferred. It is not equivalent to allowing every region to decrement the same unconstrained global counter.')+
qa([['Advanced','Why not always prefer availability during a partition?','Whether accepting a local write is allowed depends on the invariant. A delayed catalog update may be tolerable, while independently spending the same money is not. State the operation-specific trade-off and any preallocated rights instead of choosing a slogan for the whole system.'],['Intermediate','Does R+W>N guarantee a single latest value?','Not alone. It provides an intersection under the stated membership assumptions. Version order, conflict handling, concurrent write behavior, durability and reconfiguration semantics still have to establish the claimed read guarantee.']]))},
{after:'coordination',...section('saga-protocol','Persist a saga decision',
p('A saga coordinates committed local steps, so intermediate business states can be visible. It is not a transaction that later rewinds history. Consider checkout: reserve inventory, authorize payment, then confirm the order. Each participant owns its local invariant and recognizes repeated commands. The orchestrator owns the workflow decision and recovery schedule, not the internal transaction of every participant.')+
code(`Illustrative durable workflow record:
  saga_id: S7
  order_id: O7
  workflow_version: 12
  phase: PAYMENT_UNKNOWN
  reservation_id: R7
  payment_intent_id: P7
  next_action_id: A19
  next_action: INQUIRE_PAYMENT

Atomic orchestrator transaction:
  compare expected workflow_version and permitted phase
  record the newly accepted participant result
  advance phase/version
  insert next command into local outbox using stable action identity
  commit all of the above`)+
p('Persist the state transition and next-command intent together. Otherwise a crash can advance the workflow without dispatching the next action, or dispatch an action without remembering why. Participants use action/business identities to return the already established outcome on repetition. A new worker claim or delivery attempt does not create a new payment intention.')+
table(['Observed participant result','Workflow decision','What must remain unresolved'],[['Inventory hold succeeds','Store R7 and request payment P7','No paid/confirmed claim yet.'],['Payment response is lost','Record/payment remains UNKNOWN; inquire original P7','Do not infer decline from elapsed HTTP wait.'],['Payment conclusively fails','Release the specific reservation under an idempotent action','Release may itself need retry/ownership validation.'],['Payment succeeds after hold expires','Apply explicit reallocation/refund/review policy','Do not resurrect a seat/stock unit already sold to another buyer.']])+
p('Callbacks and polling can race. Use conditional state/version transitions so one accepted observation drives the next action once in the local workflow authority. Record contradictory terminal evidence instead of overwriting it silently. A participant result must be authenticated and bound to the expected order, amount/currency and original action, not accepted because it contains a familiar saga ID.')+
p('Contrast two-phase commit. A prepared participant has promised a coordinated outcome and may retain resources while the decision is recovered. It cannot safely treat its own timeout as permission to abort after another participant may have committed. A supported coordinator log and participant recovery protocol are central to that guarantee. A saga avoids that global atomic-commit boundary by accepting intermediate states and explicit compensating business actions, with different isolation and recovery obligations.')+
p('An orchestrator is a logical owner, not necessarily one immortal process. Its state must survive restart and its competing workers must obey the workflow version/claim protocol. Choreography moves decisions into participant event reactions; it does not remove the need to identify who notices a stalled workflow, which event permits each transition and how cycles or contradictory events are handled.')+
qa([['Advanced','Can an outbox alone make the saga correct?','No. It makes a local next-action intent recoverable with its state transition. Participants still need safe repetition, valid state transitions, authority checks, unknown-outcome handling and a policy for compensation failures.'],['Intermediate','Why store workflow_version when commands have unique IDs?','Command identity recognizes repeats. The version/phase predicate protects competing workflow transitions and stale observations. They address different races.']])+
refs([['https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html','AWS saga orchestration guidance','participant repetition and compensation concerns.']]))},
{after:'worked',...section('compensation-reconcile','Compensate without erasing facts',
p('“Undo the reservation” is incomplete when time and other users have moved on. Release must name the reservation it owns, not increment stock because a workflow failed. If that reservation was already released, repeating the release must not add another unit. If it was confirmed for a completed order, the cancellation policy may require a different transition. Compensation is another stateful business command.')+
code(`Conceptual reservation-release transaction:
  begin
  transition reservation R from HELD to RELEASED
    only for its authorized tenant/order and expected ownership
  if that transition changed exactly one row:
      return R.quantity to the correct inventory authority
      persist release outcome / next intent
  else:
      resolve existing state; do not increment inventory blindly
  commit

Receipt/action identity and the effect share this local transaction.
The transition predicate must cover every legitimate competing writer.`)+
p('A refund is likewise a new financial fact linked to the original charge, not deletion of the charge row. Give it a stable refund intention, amount limits and provider recovery identity. A lost refund response can leave the refund UNKNOWN; issuing a second new refund key is not a safe response. Partial refunds require an authoritative remaining-refundable-amount rule under concurrent requests.')+
table(['Evidence','Unsafe interpretation','Reconciliation action'],[['Local payment UNKNOWN; provider says success','Retry as a new payment','Record the original success, then evaluate fulfillment/compensation.'],['Reservation RELEASED; late charge success','Force reservation back to HELD','Apply late-success policy without taking another customer’s stock.'],['Refund intent exists; provider response missing','Assume refund failed','Inquire the same refund intention; retain unresolved state.'],['Old restored workflow says payment pending','Replay all steps with new IDs','Compare external facts and retained identities before another irreversible action.']])+
p('Reconciliation needs an eligible population and an owner. Scan durable unresolved intentions by age under a bounded schedule, inquire the original authority and apply conditional state transitions. Preserve the source evidence and classify already resolved, newly resolved, conflicting and still unknown outcomes. A one-off script that makes the pending count zero by overwriting state does not demonstrate recovery.')+
p('Bound automatic recovery by supported retention and business deadlines. Once provider lookup or deduplication evidence expires, automation may no longer be able to distinguish no effect from a forgotten effect. Route that limit explicitly to review rather than claiming exactly once. Keep operator actions authorized, scoped and auditable, and preserve the original business identities through manual correction.')+
p('A complete failure schedule pauses after every local commit and before every remote acknowledgement. Restart the orchestrator, redeliver callbacks, race expiry against late success and repeat compensation after its own acknowledgement is lost. Verify stock conservation, charge/refund correspondence and exactly the allowed final order states. The target is a defensible final state or a clearly owned unresolved case, not merely a workflow engine status of COMPLETED.')+
qa([['Advanced','Must compensation restore byte-for-byte original database state?','Usually no. Other valid work may have occurred, and charges, notifications or shipments cannot be erased from history. Compensation establishes an allowed new business state while preserving the original facts and respecting current ownership.'],['Intermediate','What is an acceptable terminal unresolved state?','Only one explicitly allowed by the business contract, with evidence, an owner, a review/escalation path and visibility to affected users/operators. Naming a state REVIEW_REQUIRED does not by itself resolve the customer obligation.']]))}
];
