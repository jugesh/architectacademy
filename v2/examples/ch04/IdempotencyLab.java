import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/** In-memory atomic policy only: not durable storage or provider integration. */
public class IdempotencyLab {
    record Key(String tenant, String operation, String intent) {}
    record Entry(String fingerprint, String response) {}
    static final class Ledger {
        private final ConcurrentHashMap<Key, Entry> rows = new ConcurrentHashMap<>();
        private final AtomicInteger effects = new AtomicInteger();
        String apply(Key key, String fingerprint) {
            // Deliberately no external call in compute: this models local atomic policy.
            Entry entry = rows.compute(key, (k, old) -> {
                if (old != null) {
                    if (!old.fingerprint().equals(fingerprint)) throw new IllegalArgumentException("conflict");
                    return old;
                }
                int effect = effects.incrementAndGet();
                return new Entry(fingerprint, "result-" + effect);
            });
            return entry.response();
        }
    }
    static void check(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
    public static void main(String[] args) throws Exception {
        Ledger ledger = new Ledger(); Key key = new Key("tenant-a", "capture", "intent-1");
        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch start = new CountDownLatch(1); List<Future<String>> calls = new ArrayList<>();
        try {
            for (int i=0; i<8; i++) calls.add(pool.submit(() -> {
                if (!start.await(5, TimeUnit.SECONDS)) throw new AssertionError("barrier");
                return ledger.apply(key, "amount=100;currency=INR");
            }));
            start.countDown(); Set<String> outcomes = new HashSet<>();
            for (Future<String> call : calls) outcomes.add(call.get(5, TimeUnit.SECONDS));
            check(outcomes.size()==1 && ledger.effects.get()==1, "duplicate effect");
            try {
                ledger.apply(key, "amount=200;currency=INR"); throw new AssertionError("conflict accepted");
            } catch (IllegalArgumentException expected) { /* no effect */ }
            check(ledger.effects.get()==1, "conflict executed");
            ledger.apply(new Key("tenant-b", "capture", "intent-1"), "amount=100;currency=INR");
            ledger.apply(new Key("tenant-a", "capture", "intent-2"), "amount=100;currency=INR");
            check(ledger.effects.get()==3, "distinct intent or tenant collapsed");
            check(ledger.apply(key,"amount=100;currency=INR").equals(outcomes.iterator().next()), "unstable replay");
            System.out.println("PASS: one effect for 8 duplicates; conflict rejected; tenant/intent separation and replay.");
        } finally { start.countDown(); pool.shutdownNow(); }
    }
}
