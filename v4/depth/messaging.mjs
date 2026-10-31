import {p,code,table,qa,refs,section,warn} from '../lesson-helpers.mjs';
export const messagingDepth=[
{after:'outbox',...section('relay-protocol','Build an outbox relay',
p('An outbox makes the need to publish durable alongside the business mutation. It does not make publication and the later “sent” marker atomic across a database and broker. Follow event E: the checkout transaction commits a reservation and E in the same database. A relay discovers E, sends it, waits for the configured broker acknowledgement, and then records publication. If the process dies after the broker accepted E but before the marker commits, the next relay sends E again. Duplication is the expected recovery path, not an exceptional violation of the outbox pattern.')+
code(`-- Illustrative PostgreSQL outbox; same transaction as business writes.
CREATE TABLE order_outbox (
  event_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version bigint NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  lease_until timestamptz,
  claim_epoch bigint NOT NULL DEFAULT 0
);
CREATE INDEX outbox_pending ON order_outbox (created_at, event_id)
WHERE published_at IS NULL;`)+
p('Claim a bounded batch in a short transaction, release database locks, then perform network I/O. The following is an unordered, lease-based dispatcher. It is suitable only where consumers can tolerate/detect reordering or another ordering protocol is added. Simply sorting claims does not guarantee per-order publication order when several relay workers run.')+
code(`BEGIN;
WITH candidates AS (
  SELECT event_id FROM order_outbox
  WHERE published_at IS NULL
    AND (lease_until IS NULL OR lease_until < now())
  ORDER BY created_at, event_id
  FOR UPDATE SKIP LOCKED
  LIMIT 50
)
UPDATE order_outbox o
SET lease_until = now() + interval '30 seconds',
    claim_epoch = o.claim_epoch + 1
FROM candidates c
WHERE o.event_id = c.event_id
RETURNING o.*;
COMMIT;
-- Send the returned events OUTSIDE this database transaction.
-- On a confirmed broker acknowledgement for the claimed epoch:
UPDATE order_outbox SET published_at = now(), lease_until = NULL
WHERE event_id = :event AND claim_epoch = :claimed_epoch
  AND published_at IS NULL;`)+
p('Thirty seconds and fifty rows are illustrative, not recommended defaults. Size the lease and batch from publish duration, process pauses and renewal behavior. A recovered worker increments claim_epoch. The old worker cannot mark a newer claim as published, but it may still send to the broker after its lease expired. Database fencing protects this database update; it does not retroactively cancel a network send. Consumers must still recognize E by its durable event identity.')+
table(['Window','Risk','Protocol response'],[['Commit business/outbox fails','No accepted business state or intent','Transaction rolls back; original command may retry.'],['Claim commits, worker dies before send','Event waits until reclaimable','Lease expiry and bounded rediscovery.'],['Broker accepted, acknowledgement lost','Publication outcome unknown','Republish E with the same identity.'],['Publish acknowledged, marker write fails','Event remains pending','Republish E; consumer deduplicates the local effect.']])+
p('Store the event’s business representation or a deliberately versioned reconstruction contract. If a relay rereads a mutable order after the fact, it may publish today’s state as yesterday’s event. For strict per-aggregate sequence, choose a compatible approach such as ordered source-log capture or serialized dispatch of an aggregate’s next event, and test it through takeover. A Kafka partition preserves the order actually appended to it; it does not repair two relay workers sending version 8 before version 7.')+
p('Operate from oldest unpublished age, claim failures, broker acknowledgement latency and repeated publication, not only pending count. Cleanup must respect replay/audit needs and downstream retention. Deleting a row because a send method returned before its acknowledgement future completed can permanently lose the intent.')+
qa([['Advanced','Does claim_epoch make the relay exactly once?','No. It prevents a stale worker from completing a newer database claim under this condition. A stale or uncertain send can still reach the broker. Stable event identity and a safe consumer protocol handle the duplicate effect.']])+
refs([['https://www.postgresql.org/docs/current/sql-select.html','PostgreSQL SELECT','locking clauses and SKIP LOCKED behavior.']]))},
{after:'ack',...section('consumer-transaction','Commit the consumer effect',
p('Now let fulfillment consume OrderPaid event E. The local effect is to make an order ready for packing. We need one committed local effect per consumer/event identity even if E is delivered repeatedly. The consumer name matters: fulfillment and analytics must each be allowed to process the same event. Do not globally mark E consumed for every subscriber.')+
code(`CREATE TABLE consumer_receipt (
  consumer_name text NOT NULL,
  event_id uuid NOT NULL,
  payload_hash text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (consumer_name, event_id)
);

-- Consumer transaction, AFTER schema and authorization validation:
BEGIN;
INSERT INTO consumer_receipt (consumer_name, event_id, payload_hash)
VALUES ('fulfillment-v1', :event, :hash)
ON CONFLICT (consumer_name, event_id) DO NOTHING
RETURNING event_id;
-- Duplicate branch: compare stored hash; do not repeat the effect.
-- New branch only:
UPDATE fulfillment_order
SET state = 'READY', version = :event_version
WHERE tenant_id = :tenant AND order_id = :order
  AND state = 'AWAITING_PAYMENT'
  AND version = :expected_previous_version;
-- Require the domain-approved result. A gap/conflict may need rollback.
-- Insert any next external-work intent into this database's outbox.
COMMIT;
-- Only after this commit, advance the broker acknowledgement/offset.`)+
p('This is a protocol outline: the fulfillment table and event-version contract belong to the domain model. A version predicate is useful only when producers and consumers agree what the version counts. If the consumer receives only selected event types, source aggregate versions can skip legitimately; “previous + 1” would then reject valid events. Define either a complete per-aggregate stream, a dedicated consumer sequence or a transition rule that can safely skip irrelevant source changes.')+
p('If the new-event update cannot apply, do not commit a completed receipt merely because an INSERT succeeded. Roll back and classify the conflict: missing prerequisite, stale event, invalid transition or a real incompatible schema. A business-idempotent transition may deliberately regard a known already-completed state as success, but establish that it belongs to the same business intention. “It is already READY” is not enough if the event refers to a different payment or order version.')+
table(['Crash point','Database','Broker','Recovery'],[['Before local commit','Effect and receipt absent','Unacknowledged','Redelivery runs the transaction.'],['After commit, before acknowledgement','Effect and receipt present','May redeliver','Duplicate branch verifies identity and skips the effect.'],['After acknowledgement','Effect and receipt present','Position advanced','No recovery required for that delivery.'],['Acknowledged before commit, then crash','Effect may be absent','Position advanced','Lost work: this order of operations is unsafe.']])+
p('The receipt is evidence of completed local work because it commits in the same transaction as that work. A preliminary receipt committed separately breaks that meaning. Its payload hash also detects illegal reuse of one event identity for changed content. Define a canonical event representation for the comparison, and quarantine a mismatch instead of overwriting the old receipt.')+
p('Sending a shipment request or email inside this transaction does not extend database atomicity to the remote service. Persist a shipment intent, then use a stable provider request identity and reconciliation. If the remote service cannot deduplicate or answer an inquiry, expose the weaker guarantee. A correct local inbox is not proof of exactly-once real-world shipment.')+
p('If a blocked event must be parked to allow progress, atomically store the complete recoverable event and its PARKED state before advancing the source. The recovery handler needs a distinct state transition from PARKED to APPLIED; a generic duplicate check that treats every stored receipt as completed would strand it forever. Monitor parked age and give it an owner.')+
qa([['Intermediate','Can I keep consumed IDs in Redis while effects are committed in PostgreSQL?','Only if the resulting cross-store failure protocol meets the requirement. A cache eviction or a crash between the independent writes can permit repeats or lose work. A receipt in the same local transaction is easier to reason about for this database effect.']]))},
{after:'ordering',...section('partition-recovery','Offsets and ownership',
p('A Kafka offset is a position in one partition, not a global business sequence. For a consumer group, committing offset 252 declares that the next record to resume from is 252. If record 250 is still being processed while 251 completed, committing 252 skips unfinished 250 after a crash. Parallel handlers need a contiguous completion frontier for each partition; the highest finished offset is not sufficient.')+
code(`Partition 3 delivery:
  offset 250 -> slow database transaction, NOT committed yet
  offset 251 -> local transaction committed

Safe committed next offset: 250
Unsafe committed next offset: 252

After 250 also commits, contiguous frontier becomes 252.
If the process crashes at frontier 250, 250 and 251 may replay.
The local receipt handles the already-committed 251 repeat.`)+
p('This example assumes every record below the frontier was either applied durably or handed to a defined durable recovery path. The commit mechanism, worker handoff and group lifecycle must agree on that meaning. Keep the Kafka consumer’s ownership/commit operations under the client’s supported threading model. Offloading work does not remove poll interval, buffer size and rebalance obligations.')+
p('When ownership moves, stop handing new work to the revoked partition, fence or drain the old tasks according to the framework contract, and commit only what is safely completed while ownership permits it. A paused JVM can resume an old task after another consumer acquired the partition. Broker ownership helps delivery coordination; a conditional database transition and receipt still defend the effect against stale or overlapping work.')+
p('Partition key selection connects throughput and order. Keying by order ID brings that order’s events to one partition under the chosen routing, while unrelated orders can progress elsewhere. One very active order/key still has a sequential bottleneck. Increasing partition count can change key-to-partition mapping for future records, so a migration requiring strict key order must manage old and new histories rather than assuming automatic continuity.')+
table(['Transport guarantee','What it can help guarantee','What it does not automatically include'],[['Kafka idempotent production','Protection against supported producer retry duplication in its protocol','Deduplicating a new business request created with a new identity.'],['Kafka transaction with appropriate consumers','Atomic Kafka output records and participating offsets','An arbitrary PostgreSQL commit or payment HTTP effect.'],['SQS visibility window','Temporary delivery invisibility while a worker operates','A proof that no duplicate will arrive or that the worker finished.'],['SQS delete after local commit','Remove the processed delivery through its receipt handle','Undo a committed local effect if the delete response is lost.']])+
p('For SQS, extend visibility for legitimate long work under a bounded policy, and plan for extension failure or a stalled worker. A very long visibility timeout delays recovery after a crash; a short one raises concurrent redelivery risk. Neither replaces repeat-safe processing. For Kafka, a retained log permits intentional replay only while the required records remain available; retention is part of the recovery contract.')+
qa([['Advanced','Can Kafka exactly-once processing make the database transaction and a topic output atomic?','Not by itself for an arbitrary external database. Kafka’s transaction protocol covers its participating records/offsets. Use an explicitly supported connector/protocol or a database outbox/inbox design, and state precisely which boundary has the guarantee.'],['Advanced','Should I commit a poison record so the partition can continue?','Only after an allowed terminal decision or durable recovery handoff has been recorded. Skipping without retaining enough evidence sacrifices the business work. Whether later same-key events may proceed is a domain ordering decision.']])+
refs([['https://kafka.apache.org/40/design/design/','Kafka design','partition positions, delivery semantics and transactional scope.'],['https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html','SQS visibility','delivery visibility, extensions and failure recovery.']]))},
{after:'pitfalls',...section('backlog-workbook','Backlog recovery budget',
p('A queue trades immediate coupling for a recovery obligation. Estimate how quickly it can clear accepted work while new work continues. Use comparable units: completed business jobs per second, not polls or delivery attempts. If a job produces three downstream calls, the provider budget must include that fan-out and all retries.')+
code(`Illustrative steady recovery:
  existing backlog B = 120,000 jobs
  new arrivals lambda = 600 jobs/s
  sustainable useful completion mu = 800 jobs/s
  net drain = mu - lambda = 200 jobs/s
  time to clear = B / (mu - lambda) = 600 s = 10 min

If arrivals rise to 900 jobs/s at the same capacity:
  backlog grows by 100 jobs/s; it never drains in steady state.
If redelivery doubles handler attempts but useful mu stays 800:
  attempt throughput is not a doubling of recovery capacity.`)+
p('The ten-minute estimate assumes a stationary mix, no new failure and enough capacity for each partition, database and downstream dependency. A hot ordered key can violate the fleet-average assumption. A few permanently failing jobs can also dominate the oldest-age signal while most work is current. Report age and count by bounded workload class, plus the size and age of parked/unresolved work.')+
p('Set recovery targets from the business deadline and retention. If the oldest job has already spent 20 minutes waiting and the completion deadline is 25 minutes, a ten-minute drain estimate is insufficient for that cohort. Decide whether to prioritize urgent eligible work, acquire validated capacity, degrade optional work or explicitly expire an operation. Expiry must define the business outcome; dropping an accepted paid order is not just queue housekeeping.')+
table(['Incident','Unsafe reaction','Controlled response'],[['Database slows','Double all consumers immediately','Reduce/hold admitted concurrency; inspect locks and useful completion.'],['Poison payload repeats','Retry forever with no owner','Classify and preserve it through a durable quarantine policy.'],['Recovered provider','Release the entire accumulated backlog at once','Ramp within provider and database budgets; reserve capacity for new critical work.'],['Operator requests replay','Generate new IDs for all events','Retain original identities, authorize scope and reconcile expected effects.']])+
p('A dead-letter queue is a place to retain failed deliveries, not a business resolution. Record why the item moved, what parser/schema failed and what the recovery operator may safely do. Managed broker redrive and a custom publish-then-delete routine have different guarantees. In a custom routine, a crash between those independent operations can duplicate or lose the intended handoff unless the protocol accounts for the window.')+
p('Before a replay, define the source range, consumer version, original event identities, expected duplicate behavior, ordering impact and stop criteria. Dry-run comparisons can expose incompatible old schemas, but a dry run cannot prove remote side effects are safe. Begin with a bounded cohort, observe useful completions and invariants, then expand. Keep a reconciliation report of applied, already applied, rejected and still unresolved work.')+
qa([['Advanced','Which graph proves the incident is over: queue depth falling or consumer error rate zero?','Neither alone. Verify timely useful completion, correct final business state, bounded unresolved age and safe resource use. A queue can shrink because messages expired or were discarded, while errors become zero because consumers stopped.'],['Intermediate','Why can adding workers reduce completion throughput?','More concurrent attempts can increase lock contention, connection waits, retries and provider throttling. Measure the operating point of the constrained dependency and bound the fleet’s aggregate pressure.']]))}
];
