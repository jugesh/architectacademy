import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/** Local fail-fast admission invariant; no network or distributed quota claim. */
public class AdmissionLab {
    static class Gate {
        private final Semaphore permits;
        Gate(int capacity) { permits = new Semaphore(capacity); }
        boolean run(Runnable effect) {
            if (!permits.tryAcquire()) return false;
            try { effect.run(); return true; }
            finally { permits.release(); }
        }
    }
    static void check(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }
    public static void main(String[] args) throws Exception {
        Gate gate = new Gate(2);
        AtomicInteger active = new AtomicInteger(), peak = new AtomicInteger();
        AtomicInteger effects = new AtomicInteger();
        CountDownLatch entered = new CountDownLatch(2), release = new CountDownLatch(1);
        ExecutorService workers = Executors.newFixedThreadPool(2);
        Runnable held = () -> {
            peak.accumulateAndGet(active.incrementAndGet(), Math::max);
            effects.incrementAndGet(); entered.countDown();
            try {
                if (!release.await(5, TimeUnit.SECONDS)) throw new AssertionError("barrier timeout");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt(); throw new RuntimeException(e);
            } finally { active.decrementAndGet(); }
        };
        try {
            Future<Boolean> first = workers.submit(() -> gate.run(held));
            Future<Boolean> second = workers.submit(() -> gate.run(held));
            check(entered.await(5, TimeUnit.SECONDS), "workers did not enter");
            check(!gate.run(() -> { throw new AssertionError("rejected effect ran"); }), "third admitted");
            check(effects.get() == 2, "unexpected effect count");
            release.countDown();
            check(first.get(5, TimeUnit.SECONDS) && second.get(5, TimeUnit.SECONDS), "admitted work failed");
            check(peak.get() == 2 && active.get() == 0, "active bound violated");
            try {
                gate.run(() -> { throw new IllegalStateException("expected"); });
                throw new AssertionError("exception swallowed");
            } catch (IllegalStateException expected) { /* propagated, permit still released */ }
            check(gate.run(() -> effects.incrementAndGet()), "permit leaked after failure");
            check(effects.get() == 3, "final effect missing");
            System.out.println("PASS: bound=2; rejected effect absent; completion and failure release permits.");
        } finally { release.countDown(); workers.shutdownNow(); }
    }
}
