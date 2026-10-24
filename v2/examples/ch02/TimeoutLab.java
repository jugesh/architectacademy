import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/** Loopback-only demonstration: a client timeout is not a server rollback. Java 17+. */
public class TimeoutLab {
    public static void main(String[] args) throws Exception {
        var effects = new AtomicInteger();
        var completed = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.setExecutor(executor);
        server.createContext("/ready", exchange -> {
            exchange.sendResponseHeaders(204, -1); exchange.close();
        });
        server.createContext("/operation", exchange -> {
            try {
                if (!exchange.getRequestMethod().equals("POST")) {
                    exchange.sendResponseHeaders(405, -1); return;
                }
                exchange.getRequestBody().readAllBytes();
                Thread.sleep(800); // Fault injection, not production business code.
                effects.incrementAndGet(); // Simulated committed effect, even if caller left.
                completed.countDown();
                exchange.sendResponseHeaders(204, -1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (java.io.IOException expectedAfterDisconnect) {
                // A disconnected response does not reverse the simulated effect.
            } finally { exchange.close(); }
        });
        server.start();
        try {
            var origin = "http://127.0.0.1:" + server.getAddress().getPort();
            var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2))
                    .followRedirects(HttpClient.Redirect.NEVER).build();
            var warmup = client.send(HttpRequest.newBuilder(URI.create(origin + "/ready"))
                    .timeout(Duration.ofSeconds(2)).GET().build(), HttpResponse.BodyHandlers.discarding());
            if (warmup.statusCode() != 204) throw new AssertionError("warmup failed");
            var request = HttpRequest.newBuilder(URI.create(origin + "/operation"))
                    .timeout(Duration.ofMillis(200)).POST(HttpRequest.BodyPublishers.noBody()).build();
            boolean timedOut = false;
            try { client.send(request, HttpResponse.BodyHandlers.discarding()); }
            catch (HttpTimeoutException expected) { timedOut = true; }
            if (!timedOut) throw new AssertionError("expected client timeout");
            if (!completed.await(5, TimeUnit.SECONDS) || effects.get() != 1)
                throw new AssertionError("expected one completed server effect");
            System.out.println("PASS: client timed out; server completed one effect. Do not infer rollback.");
        } finally {
            server.stop(0);executor.shutdownNow();
        }
    }
}
