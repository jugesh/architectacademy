import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/** Safe publication regression, not a substitute for JMM reasoning. Java 17+. */
public class PublicationLab {
    record Limits(int concurrent, int queue) {
        Limits { if (concurrent <= 0 || queue != concurrent * 5) throw new IllegalArgumentException(); }
    }
    public static void main(String[] args) throws Exception {
        AtomicReference<Limits> config = new AtomicReference<>(new Limits(10,50));
        AtomicInteger reads = new AtomicInteger(); CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(5); List<Future<?>> tasks = new ArrayList<>();
        try {
            tasks.add(pool.submit(() -> {
                await(start);
                for(int i=0;i<100_000;i++) { int n=(i&1)==0?10:20;config.set(new Limits(n,n*5)); }
            }));
            for(int t=0;t<4;t++) tasks.add(pool.submit(() -> {
                await(start);
                for(int i=0;i<100_000;i++) {
                    Limits s=config.get();
                    if(s.queue()!=s.concurrent()*5) throw new AssertionError("mixed snapshot");
                    reads.incrementAndGet();
                }
            }));
            start.countDown(); for(Future<?> f:tasks) f.get(10,TimeUnit.SECONDS);
            if(reads.get()!=400_000) throw new AssertionError("lost atomic count");
            System.out.println("PASS: 400000 coherent snapshot reads and exact atomic count.");
        } finally { start.countDown();pool.shutdownNow(); }
    }
    static void await(CountDownLatch start) {
        try { if(!start.await(5,TimeUnit.SECONDS)) throw new AssertionError("start timeout"); }
        catch(InterruptedException e) { Thread.currentThread().interrupt();throw new RuntimeException(e); }
    }
}
