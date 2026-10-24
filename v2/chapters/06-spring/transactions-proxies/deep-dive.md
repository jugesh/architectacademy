# Spring MVC, transactions and outbox lab

## Request pipeline in a JSON-only service
A typical request crosses servlet filters, DispatcherServlet, handler mapping, adapter, controller argument binding, controller, return-value handlers and HttpMessageConverters. @RestController ordinarily writes JSON using a converter such as Jackson, not an HTML ViewResolver template. Validation exceptions and domain exceptions must be mapped to deliberate status codes; do not leak stack traces or internal IDs.

## Understand transactional proxies
Spring usually applies @Transactional via interception. An invocation that bypasses the proxy, such as this.someTransactionalMethod() in the same target object, bypasses this advice. Transaction scope is also about **resource participation**: a SQL transaction does not include an S3 upload or Kafka publish merely because the method has an annotation.

```text
HTTP -> Controller -> CheckoutService proxy -> DB transaction
                                    |               |
                                    |           order row
                                    |           outbox row
                                    +--- commit -----+
                                                                                                               Outbox worker -> Kafka
```

## Durable outbox skeleton
```java
@Service
public class CheckoutService {
    private final OrderRepository orders;
    private final OutboxRepository outbox;

    public CheckoutService(OrderRepository orders, OutboxRepository outbox) {
        this.orders = orders;
        this.outbox = outbox;
    }

    @Transactional
    public void placeOrder(Order order) {
        orders.save(order);
        outbox.save(new OutboxEvent(order.getId(), "OrderPlaced",
                                   order.toEventJson()));
    }
}
```
This code assumes domain and outbox use one transactional database and mapper configuration. A real repository also needs uniqueness for event identity, serialization version, publication metadata and retry policy. The worker can publish twice if it crashes between Kafka send and marking delivered; consumer handlers must deduplicate business effects.

## Crash matrix

| Failure | Database result | Kafka effect | Recovery |
|---|---|---|---|
| exception before commit | order/outbox roll back | none | retry request safely |
| process crash after commit | both durable | maybe not sent | publisher scans outbox |
| crash after publish before mark | both durable | may be duplicated | consumer deduplicates |
| consumer SQL commit before offset | business effect durable | message replay | unique processed-event key |

## Isolation and propagation
Isolation defines which concurrent phenomena are permitted by the database, not by Spring alone. Default isolation generally delegates to the database. REQUIRES_NEW may demand a second connection while outer transaction resources are still held; this can exhaust pools under concurrency. Read-only is often a hint and not a guarantee that SQL writes will be impossible. Do not hold transactions around slow remote calls; transaction duration increases locking and pool occupancy.

## Experiment: reproduce self-invocation
1. Put @Transactional on a public method that inserts data and deliberately throws a runtime exception.
2. Call through a Spring-managed proxy and verify rollback.
3. Invoke that method via another method on the same object and observe that advice may be bypassed.
4. Move the transactional method to another bean or use TransactionTemplate, and rerun.
5. Test against the intended database engine; repository mocks are not isolation tests.

## Design interview: answered
**Why is @Transactional not enough for exactly-once Kafka delivery?** A database commit and a Kafka publish do not share a single local atomic transaction. Use outbox and idempotent consumers.

**What happens when an exception is swallowed?** If no rollback rule or rollback-only flag applies, the transaction can commit.

**How do you make an event handler idempotent?** Insert a unique (consumer,event_id) marker in the same SQL transaction as the business mutation.

**Why might @Async not run asynchronously?** A self-call can bypass its proxy, or executor configuration may not be active.

**Which tests prove locking behavior?** Two real concurrent transactions on a faithful database with controlled synchronization points; unit mocks do not reproduce MVCC.

## Production observability
Trace through request filters, transaction, outbox insert, worker publish and consumer apply. Alert on oldest unpublished event age, publish retry count, dead-letter backlog, pool waits, transaction duration and duplicate-event suppressions.
