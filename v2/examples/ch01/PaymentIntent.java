import java.util.Objects;

/** Pure domain policy, not a database or payment-provider implementation. */
public record PaymentIntent(String key, long amountMinor, State state) {
    public enum State { PENDING, UNKNOWN, SUCCEEDED, DECLINED }
    public enum Observation { TIMEOUT, CONFIRMED_SUCCESS, CONFIRMED_DECLINE }

    public PaymentIntent {
        if (key == null || key.isBlank() || amountMinor <= 0)
            throw new IllegalArgumentException("Stable key and positive amount required");
        Objects.requireNonNull(state);
    }

    public PaymentIntent observe(Observation event) {
        Objects.requireNonNull(event);
        State next = switch (event) {
            case TIMEOUT -> State.UNKNOWN;
            case CONFIRMED_SUCCESS -> State.SUCCEEDED;
            case CONFIRMED_DECLINE -> State.DECLINED;
        };
        if (state == State.SUCCEEDED || state == State.DECLINED) {
            // A late timeout must not erase an authoritative terminal result.
            if (event == Observation.TIMEOUT || state == next) return this;
            throw new IllegalStateException("Conflicting terminal result: reconcile manually");
        }
        return new PaymentIntent(key, amountMinor, next);
    }

    public static void main(String[] args) {
        var p = new PaymentIntent("tenant-7/order-42/payment-1", 12500, State.PENDING);
        var unknown = p.observe(Observation.TIMEOUT);
        require(unknown.state == State.UNKNOWN, "timeout is not decline");
        var paid = unknown.observe(Observation.CONFIRMED_SUCCESS);
        require(paid.key.equals(p.key), "identity survives reconciliation");
        require(paid.observe(Observation.CONFIRMED_SUCCESS).equals(paid), "duplicate confirmation");
        require(paid.observe(Observation.TIMEOUT).equals(paid), "late timeout");
        try {
            paid.observe(Observation.CONFIRMED_DECLINE);
            throw new AssertionError("conflict silently accepted");
        } catch (IllegalStateException expected) { /* route to reconciliation */ }
        require(p.observe(Observation.CONFIRMED_DECLINE).state == State.DECLINED,
                "definitive decline");
        System.out.println("PASS: six payment-state invariants");
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}
