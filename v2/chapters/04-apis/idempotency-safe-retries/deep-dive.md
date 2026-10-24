# Crash-safe POST and payment intent lab

## Contract before code
A payment API must support retries when the client never receives the first response. The unit of deduplication is a **payment intent** or other stable business operation, not the exact HTTP bytes. For each authenticated tenant and operation ID, one logical intent must not cause two independent charges.

Define four cases: new key with new request; same key with equivalent request while processing; same key after completion; same key with different canonical request payload. Document status codes and responses. A server cannot promise exactly-once network delivery. It can promise durable deduplication for the domain effect under explicit assumptions.

## Failure timeline
```text
Client             API                   Database             Provider
  | POST key K      |                       |                      |
  |---------------->| persist intent K      |                      |
  |                 |---------------------->|                      |
  |                 | invoke charge (K)     |                      |
  |                 |--------------------------------------------->|
  |                 |                 [provider charges card]      |
  |                 X process crash                                |
  | timeout         |                       |                      |
  | POST key K      |                       |                      |
  |---------------->| load existing K       |                      |
  |                 | query provider by K   |                      |
  |                 |--------------------------------------------->|
  |                 |<-------------------------- charge confirmed --|
  |                 | store terminal outcome |                      |
  |<------ replay --|                       |                      |
```
Never retry the remote charge with a newly minted provider identity after ambiguity. Query and reconcile first. Some providers support replay with the same idempotency key; verify precise semantics and retention with that provider.

## Suggested durable tables
```sql
CREATE TABLE payment_intent (
  tenant_id      varchar(80) NOT NULL,
  intent_id      varchar(100) NOT NULL,
  request_hash   char(64) NOT NULL,
  state          varchar(20) NOT NULL,
  provider_ref   varchar(150),
  result_json    text,
  version        bigint NOT NULL DEFAULT 0,
  updated_at     timestamp NOT NULL,
  PRIMARY KEY (tenant_id, intent_id)
);
CREATE UNIQUE INDEX payment_provider_ref_unique
  ON payment_intent(provider_ref);
```
Whether a nullable unique index permits multiple NULL values is database-specific. Payment states should include a **requires-reconciliation** path, not merely a catch-all FAILED state. A provider timeout is an unknown outcome, not proof of decline.

## Atomic state ownership
```sql
UPDATE payment_intent
SET state = 'PROCESSING', version = version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = :tenant AND intent_id = :intent
  AND state IN ('NEW','RETRYABLE')
  AND version = :expectedVersion;
```
Check updated-row count. An update count of zero means ownership was not obtained; reread and follow the current state instead of charging. A generation/version prevents a stale worker from committing after another owner has recovered the intent. Leases require time assumptions and fencing because a paused owner can wake up after expiry.

## What must be in one transaction?
For a wholly local business effect, put the claim, domain mutation and terminal response in one database transaction if doing so does not require blocking remote calls. For a remote effect, persist intent **before** invocation, then reconcile asynchronously or after a retry. Do not keep a SQL transaction open across a slow card-provider call merely to pretend there is distributed atomicity.

## Tests to kill the process at every boundary
1. Before intent insert: next request can start fresh.
2. After insert but before remote call: recover intent and safely invoke.
3. After provider commit before local confirmation: reconcile; do not double charge.
4. After local confirmation before HTTP response: return stored outcome on retry.
5. Two simultaneous requests with same key: unique ownership; only one provider interaction.
6. Same key with different amount: reject without charge.
7. Retry after expiration: explicit business uniqueness still prevents a second charge when required.

## Architecture interview: answered
**What is wrong with hashing the body as the key?** Two separate legitimate purchases can have identical bodies, and semantically equivalent JSON can have different bytes. The key must identify a business intent.

**Is 409 mandatory for in-progress duplicates?** No. 409, 202 or a bounded wait can work; publish one consistent contract.

**Will an idempotency cache guarantee correctness?** No. Cache eviction and TTL expiry can cause re-execution. Durable business constraints must protect irreversible side effects.

**Should transient provider failures always be retried?** Only when the request's outcome is known safe to retry under the provider's contract. Timeout ambiguity requires lookup/reconciliation.

**What belongs in metrics?** In-flight intents, age of unresolved intents, deduplicated replays, fingerprint conflicts, successful reconciliations, provider mismatches and actual double charges.

## Final design principle
Exactly-once **effect** is a product and persistence contract. Exactly-once **execution** across an unreliable network is the wrong mental model.
