import {p,code,table,qa,refs,section,warn} from '../lesson-helpers.mjs';
export const databaseDepth=[
{after:'model',...section('sql-checkout','SQL checkout protocol',
p('Follow one concrete command: tenant T asks to reserve two units of SKU S using command key K. We want three local facts to agree: K has one result, stock is reduced once, and a reservation exists for that reduction. The example uses PostgreSQL and one inventory row per tenant/SKU. It deliberately excludes remote payment from the transaction. JDBC-style named parameters below represent values bound by the application, not string concatenation.')+
code(`CREATE TABLE stock (
  tenant_id uuid NOT NULL,
  sku text NOT NULL,
  available integer NOT NULL CHECK (available >= 0),
  PRIMARY KEY (tenant_id, sku)
);
CREATE TABLE reserve_command (
  tenant_id uuid NOT NULL,
  command_key text NOT NULL,
  request_hash text NOT NULL,
  reservation_id uuid NOT NULL,
  PRIMARY KEY (tenant_id, command_key)
);
CREATE TABLE reservation (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  state text NOT NULL CHECK (state IN ('HELD','CONFIRMED','RELEASED')),
  FOREIGN KEY (tenant_id, sku) REFERENCES stock (tenant_id, sku)
);`)+
p('The command key is scoped by tenant. Its request hash is a server-computed digest of a canonical business command: schema/version, SKU and quantity, plus any other field that changes its meaning. Hashing arbitrary JSON bytes can misclassify harmless field-order differences. Authenticate first and derive the tenant from trusted authorization context. A caller must not use another tenant’s key to learn or reuse a result.')+
code(`-- Application validates quantity > 0 before BEGIN.
BEGIN;
INSERT INTO reserve_command
  (tenant_id, command_key, request_hash, reservation_id)
VALUES (:tenant, :key, :hash, :reservation)
ON CONFLICT (tenant_id, command_key) DO NOTHING
RETURNING reservation_id;

-- Branch in the application on whether INSERT returned a row.
-- NEW command only:
UPDATE stock SET available = available - :quantity
WHERE tenant_id = :tenant AND sku = :sku
  AND available >= :quantity
RETURNING available;
-- Require exactly one returned row; otherwise ROLLBACK.
INSERT INTO reservation (id, tenant_id, sku, quantity, state)
VALUES (:reservation, :tenant, :sku, :quantity, 'HELD');
COMMIT;`)+
p('There are two branches, not one script to execute unconditionally. If the command insert returned no row, do not touch stock. Under the chosen Read Committed protocol, issue a subsequent SELECT for the existing command, compare the stored hash, and return its committed reservation. A different hash is a conflict. An insert competing on the unique key can wait for the other transaction; bound that wait. The subsequent statement has its own snapshot. If retention/deletion or another exceptional condition leaves no record, stop or retry the whole bounded protocol rather than pretending the command is new.')+
p('If stock is insufficient or the SKU is missing, this simplified protocol rolls back the command claim as well. It does not persist a permanent rejected result; a later retry can succeed after replenishment. That is a chosen contract. If the API promises identical replay of rejected commands too, model the rejection as a durable command outcome, with a protocol that leaves stock unchanged. Do not accidentally promise immutable replay while deleting the evidence needed to implement it.')+
table(['Crash point','Committed state','Safe next action'],[['Before commit','Neither command, decrement nor reservation commits','Retry the original tenant/key and payload.'],['After commit, before HTTP response','All three facts exist','Resolve the existing command; do not decrement again.'],['During an uncertain COMMIT response','Caller cannot infer whether commit happened','Open a fresh transaction and inquire by the same key.']])+
p('For several SKUs, acquire/update them in a deterministic order and roll back the entire reservation if any required item fails. Keep transactions short. Add the durable outbox intent in this transaction when downstream work is required. A CHECK constraint remains a backstop for negative stock, but the positive quantity validation, duplicate-command branch and reservation correspondence are equally necessary.')+
qa([['Advanced','Why not catch a uniqueness exception and continue issuing SQL in the same PostgreSQL transaction?','An error can leave the transaction aborted. This example uses ON CONFLICT for the expected duplicate branch. For other failures, roll back the appropriate boundary and begin a fresh transaction; do not assume Java catching restores database usability.'],['Intermediate','Does keeping command keys for one day give lifetime idempotency?','No. After deletion, a late retry can look new. Retention must cover the allowed replay/recovery window or leave an equivalent durable identity rule. State the guarantee and its expiry explicitly.']])+
refs([['https://www.postgresql.org/docs/current/sql-insert.html','PostgreSQL INSERT','conflict handling and RETURNING semantics.']]))},
{after:'indexes',...section('query-diagnosis','Read a query plan',
p('A query can be logically correct yet make an expensive physical request. Diagnose the customer’s “latest orders” page on representative data, including a large tenant. First write the exact predicate and order; then count the rows the engine must examine to produce the requested 25 results. Total table size alone does not identify that work.')+
code(`-- Seek after the last row of the preceding page.
SELECT id, created_at, status
FROM orders
WHERE tenant_id = :tenant AND customer_id = :customer
  AND (created_at, id) < (:cursor_time, :cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 25;

-- Same access shape, with equality keys before the ordering keys.
CREATE INDEX order_customer_recent
ON orders (tenant_id, customer_id, created_at DESC, id DESC);

-- Inspect first; executing a real query consumes real resources.
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at, status
FROM orders
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND customer_id = '00000000-0000-0000-0000-000000000002'
ORDER BY created_at DESC, id DESC LIMIT 25;`)+
p('The two UUIDs are illustrative fixture values. The first page omits the cursor predicate; later pages include both cursor fields. The timestamp and ID form a deterministic order. This supports efficient continuation through the chosen order, but is not a snapshot: a status can change, a row can disappear and a newly inserted backdated row can affect later reads. A stable export needs an explicit snapshot or materialized dataset policy.')+
code(`Illustrative plan comparison — invented numbers, not a benchmark:
A: Seq Scan -> Sort -> Limit
   estimated matching rows: 200
   actual matching rows:    80,000
   rows removed by filter: 920,000
B: Limit -> Index Scan using order_customer_recent
   actual returned rows: 25
   index condition: tenant + customer (+ cursor for later pages)`)+
p('In A, two problems may coexist: the access path performs too much work, and the cardinality estimate is far from reality. Check predicates, data distribution and statistics rather than forcing an index blindly. In B, verify the real plan can stop early; do not assume an index name alone proves efficiency. Status filtering can require visiting many candidate rows if that predicate is not well served by the selected path. A partial or differently shaped index may help a frequent, well-defined subset, at the cost of another maintained structure.')+
table(['Plan observation','Interpretation to investigate','Next measurement'],[['Estimated rows far below actual','Statistics, skew or correlated predicates may be misestimated','Compare typical/large tenants and refresh/analyze appropriate statistics.'],['Sort spills','Working set exceeds the memory available to that operation','Reduce unnecessary rows; inspect aggregate concurrency before raising memory.'],['Many loops on inner node','Nested repeated work may dominate','Multiply per-loop work by loops; inspect join selectivity.'],['Many buffer hits but slow','Cached access still consumes CPU/locks/work','Inspect rows examined, waits and execution time, not only disk I/O.']])+
p('Planner cost is not milliseconds. Actual rows and time can be per execution of a node, so interpret loops correctly. Buffer hits indicate blocks found in PostgreSQL’s buffer cache; they do not mean the query was free. A sequential scan can legitimately beat random indexed access for a broad scan. Keep before/after measurements under comparable data, cache warmth and concurrency, then verify insert/update overhead and index size as well as read latency.')+
warn('EXPLAIN ANALYZE executes the statement. A surrounding rollback does not necessarily undo every side effect, such as sequence allocation or external behavior invoked by a function. Start with read-only, bounded diagnosis and an appropriate environment.')+
qa([['Advanced','An index fixed one tenant but not the largest tenant. Is the index broken?','Not necessarily. The large tenant may select many more rows, use a different plan, encounter a hot working set or need another access shape. Compare parameters, estimates, rows examined, waits and pagination depth before changing the design.']])+
refs([['https://www.postgresql.org/docs/current/using-explain.html','PostgreSQL EXPLAIN guide','plan nodes, actual measurements and execution caveats.']]))},
{after:'transactions',...section('isolation-schedule','Two writers, one invariant',
p('Isolation is easier to understand as an interleaving than as four names. Start with stock=1. In a naive read-then-write design, transaction A reads 1 and transaction B reads 1. Each application decides it may sell the last unit. If both later store the computed value 0 and insert separate successful reservations, the final stock value is nonnegative while two units were promised. A CHECK on available cannot detect this cross-record mismatch.')+
table(['Time','Transaction A','Transaction B'],[['1','Read available=1',''],['2','','Read available=1'],['3','Unconditional write of calculated available=0; insert reservation A',''],['4','Commit','Write calculated available=0; insert reservation B; commit'],['Result','Inventory says 0','Two reservations exist for one initial unit']])+
p('Move the decision into the conditional UPDATE from the checkout protocol. Under PostgreSQL Read Committed, competing updates of the same row coordinate through the database; after a conflicting updater commits, the waiting command rechecks its condition on the updated row. In this specific one-row decrement, one buyer consumes the unit and the other updates no row. The application must treat that zero-row result as failure and roll back its associated work. This reasoning does not automatically cover arbitrary multi-row predicates.')+
p('Consider a different invariant: at least one on-call engineer must remain for a shift. Alice and Bob each read that two engineers are on call, then each updates only their own row to off-call. Under snapshot isolation, both can work from a consistent snapshot yet change different rows. Both leaving is write skew: the invariant covers the set, while the writes do not conflict on the same row. A stable snapshot alone does not serialize the business decision.')+
table(['Approach','What makes the set-wide decision safe','Obligation'],[['Serialize through a shift authority row','Every roster mutation locks the same shift row before checking/modifying assignments','All mutation paths must follow this protocol, including support jobs.'],['Serializable transactions','The database rejects executions it cannot serialize under its contract','Retry the whole failed transaction and its decision logic, within a bounded budget.'],['Redesign the representation','Store/enforce the invariant through a smaller atomic authority','Prove the new model covers every allowed transition.']])+
p('The shift-row approach deliberately introduces contention at the shift’s authority. This may be acceptable because roster changes are rare. It is not a universal instruction to lock one global row for all traffic. Ask how often the same invariant is contested, how long the critical section lasts and whether the domain can partition it without changing its meaning.')+
code(`Illustrative lock-order rule for a multi-item reservation:
1. Sort requested (tenant, sku) identities deterministically.
2. Update/lock in that order inside one transaction.
3. If any prerequisite fails, roll back the whole reservation.
4. On a retryable concurrency failure, begin a fresh transaction.
5. Re-run all reads and decisions with the original command identity.
6. Never repeat an unprotected external side effect in that retry loop.`)+
p('Consistent lock order reduces deadlock opportunities but is not a proof that deadlocks cannot occur; triggers and other writers can acquire additional locks. A deadlock victim or serialization failure needs a fresh attempt with fresh observations. Retry only the relevant classified concurrency failures; unique business conflicts and invalid input are different outcomes. Count retries, cap them and expose exhausted contention instead of hiding a hot-key design problem behind unlimited attempts.')+
qa([['Advanced','Why is retrying only the final UPDATE after a serialization failure unsafe?','The earlier reads selected the action. They may be stale or belong to an aborted transaction. Roll back and rerun the whole transactional decision, keeping the logical command identity stable and external effects outside the retry boundary.'],['Intermediate','Does SELECT FOR UPDATE protect a row that does not exist?','A row lock cannot lock an absent row as an existing tuple. Use an appropriate uniqueness/authority/isolation protocol for creation and predicate-wide rules rather than assuming a missing lookup reserves a future identity.']])+
refs([['https://www.postgresql.org/docs/current/transaction-iso.html','PostgreSQL isolation','snapshot behavior, concurrent updates and serializable retries.'],['https://www.postgresql.org/docs/current/explicit-locking.html','PostgreSQL locking','row locks, contention and deadlocks.']]))},
{after:'worked',...section('spring-commit','Spring commit and recovery',
p('Place the reservation protocol behind an application boundary whose transaction actually covers the participating SQL statements. The following Java outline uses TransactionTemplate to make the commit boundary visible. Assume this is the outermost transaction boundary with no ambient transaction; a template joining an existing transaction would not commit that outer transaction on return. Repositories, canonical hashing, SQL bindings and error mapping are application-specific; this is orchestration pseudocode, not a complete compilable service. In particular, a repository insert returning does not prove that the enclosing transaction committed.')+
code(`ReservationResult reserve(Command command) {
  validatePositiveQuantityAndAuthorizedTenant(command);
  // Outermost boundary: no ambient transaction; intended DB manager.
  return transactionTemplate.execute(tx -> {
    Claim claim = commands.tryClaim(command.key(), command.hash());
    if (!claim.isNew()) {
      return commands.resolveSamePayload(command); // no stock mutation
    }
    if (stock.decrementIfEnough(command) != 1) {
      throw new InsufficientStock(); // runtime exception -> rollback here
    }
    reservations.insertHeld(claim.reservationId(), command);
    outbox.insertReservationHeld(claim.reservationId(), command);
    return ReservationResult.held(claim.reservationId());
  }); // Commit completes before a successful result escapes this call.
}
// Only now map the successful result to an HTTP response.
// A lost HTTP response is recovered through the original command key.`)+
p('If declarative @Transactional is used instead, identify the external caller crossing the managed proxy. Calling an annotated method through this in the ordinary proxy mode can bypass its interceptor. Also establish which transaction manager and data source every repository uses. A second database or HTTP provider is not silently included because the method has an annotation. Checked versus unchecked exceptions and configured rollback rules affect whether the intended group is rolled back.')+
p('With JPA, changes may be flushed later than the save call. A uniqueness or foreign-key violation can surface at flush or commit. Moving an email send between save and commit creates a gap: the email can be sent even though the order later rolls back. Use the outbox for a recoverable external effect; an after-commit callback alone can still be lost if the process dies after commit and before the callback completes.')+
p('REQUIRES_NEW is an independent transaction, not a repair switch. An inner committed audit/business write can survive outer rollback, which may be intended for some evidence but wrong for coupled business state. With an outer transaction holding a connection, inner work can also require another connection and create pool pressure. Explain the desired survival relationship before selecting propagation.')+
table(['Injection','Expected durable result','Evidence to inspect'],[['Fail after stock UPDATE, before reservation INSERT','No decrement, claim or outbox remains','Fresh-connection read of all relevant tables.'],['Fail after outbox INSERT, before COMMIT','All local changes roll back','No publishable intent without the reservation.'],['Commit then drop HTTP response','Exactly one reservation; repeat resolves it','Same key/payload returns the committed identity.'],['Two identical commands race','One stock effect','Constraint result, command mapping and row counts.'],['Same key with different quantity','Conflict, no second mutation','Hash comparison and unchanged inventory.'],['Lose database connection around COMMIT','Outcome treated as uncertain until inquiry','Original key queried on the authoritative path.']])+
p('Do these checks with the actual engine and transaction configuration used by the service. A mocked repository cannot reproduce lock waits, commit failures or isolation schedules. For capacity diagnosis, separate pool acquisition, transaction execution, lock wait and response time. Increasing pool size when transactions hold locks across remote waits can make contention worse. The complete argument includes correctness during failure and useful throughput under realistic contention, not only a happy-path integration test.')+
qa([['Advanced','The transaction callback returned a result, but the caller received a commit exception. Can the HTTP handler return success?','No. Returning from the callback stages the result inside transaction orchestration. The commit boundary still has to complete. Classify the actual outcome and use stable identity inquiry when commit acknowledgement is ambiguous; do not send a success derived only from the callback value.']])+
refs([['https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html','Spring propagation','logical/physical transactions and independent inner transactions.']]))}
];
