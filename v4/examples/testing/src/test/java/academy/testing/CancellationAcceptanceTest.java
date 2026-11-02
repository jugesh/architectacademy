package academy.testing;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import academy.testing.CancellationPolicy.State;
import academy.testing.CancellationPolicy.Decision;

class CancellationAcceptanceTest {
    // Domain fixture only: no HTTP, authorization, persistence or concurrency.
    private static final class Order {
        private State state;
        private final CancellationPolicy policy = new CancellationPolicy();

        Order(State state) { this.state = state; }

        Decision cancel() {
            Decision decision = policy.decide(state);
            if (decision == Decision.CANCEL) state = State.CANCELLED;
            return decision;
        }
    }

    @Test
    void anUnclaimedOrderCanBeCancelled() {
        // Given
        var order = new Order(State.CREATED);
        // When
        var outcome = order.cancel();
        // Then
        assertEquals(Decision.CANCEL, outcome);
        assertEquals(State.CANCELLED, order.state);
    }

    @Test
    void aClaimedOrderCannotBeCancelled() {
        var order = new Order(State.CLAIMED);
        assertEquals(Decision.TOO_LATE, order.cancel());
        assertEquals(State.CLAIMED, order.state);
    }

    @Test
    void repeatingCancellationDoesNotRepeatTheTransition() {
        var order = new Order(State.CREATED);
        assertEquals(Decision.CANCEL, order.cancel());
        assertEquals(Decision.ALREADY_CANCELLED, order.cancel());
        assertEquals(State.CANCELLED, order.state);
    }
}
