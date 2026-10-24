# Kafka offsets, failures and replay lab

## The atomicity problem
A consumer reads Kafka, updates PostgreSQL and commits its Kafka offset. Kafka offset commit and SQL commit are separate effects. If SQL commits and the consumer crashes before offset commit, Kafka redelivers the record. Design for duplicate processing rather than assuming the broker can magically coordinate the SQL transaction.

```text
Kafka topic partition -> consumer -> SQL transaction:
                                     1. INSERT processed_event(id)
                                     2. update business state
                                     3. COMMIT
                              then -> commit Kafka offset
```

## Deduplicate in the same SQL transaction
```sql
CREATE TABLE processed_event (
  consumer_name varchar(80) NOT NULL,
  event_id      varchar(120) NOT NULL,
  processed_at  timestamp NOT NULL,
  PRIMARY KEY (consumer_name, event_id)
);
```
Within one database transaction, attempt to insert the marker and apply the business mutation. On a duplicate-key conflict, roll back the failed statement/transaction as appropriate for the database, then treat the event as already processed; do not blindly continue a transaction left in error state. The identifier must be globally stable for the logical event within the consumer's deduplication scope.

## Broker and consumer failure windows
1. Crash before SQL commit: SQL rolls back, Kafka replay applies once.
2. Crash after SQL commit before offset commit: replay detects processed_event and skips mutation.
3. Commit Kafka offset before SQL effect: message can be permanently missed; avoid this ordering.
4. Handler fails repeatedly on one record: apply bounded retry and DLQ strategy; account for ordering requirements.
5. Consumer revocation during a long handler: ensure no unsafe processing by a stale partition owner.

## Partitions and keys
Kafka guarantees ordering **within a partition**, not total ordering across a topic. If all events for account 42 must be ordered, use that account ID as partition key and design around hot accounts. With 24 partitions, no more than 24 consumers in a single group can actively own those partitions at once. A hot partition is not fixed by adding consumers to the group: you may need key-level redesign while preserving ordering.

## Producer durability
Idempotent producer configuration reduces retry duplicates under Kafka's supported semantics; it does not remove duplicates introduced by upstream business workflows. Replication factor, minimum in-sync replicas, acknowledgments and leader-election policy jointly affect loss and availability. Test these settings under broker termination, partition leader changes and network faults.

## Replays are operationally hazardous
Replaying an order event can resend confirmation emails or repeat provider calls unless effects are deduplicated. Replay runbooks should define scope, starting offsets, dry-run mode, downstream rate limits, side-effect suppression when appropriate and post-replay reconciliation. Schema evolution needs backward-compatible consumers and clear event versioning.

## Incident questions
**Does Kafka exactly-once processing solve SQL deduplication?** Kafka transactions cover supported Kafka flows, not automatically arbitrary SQL transactions; protect SQL effects separately.

**What if a record has no stable event ID?** Introduce one at production or derive a sufficiently stable, documented identity; partition-offset identity is tied to log position rather than business intent.

**Why can committed consumer lag be low but work incomplete?** Offsets may advance before durable effect, or async processing may still be outstanding. Measure business completion separately.

**What if one key produces 60% of traffic?** One partition may dominate. Repartitioning by finer key increases parallelism but can break per-key ordering expectations.

**How should DLQs be operated?** With alerting, ownership, retention, replay policy, cause classification, and safeguards against poison-message loops.
