package academy.testing;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;
import academy.testing.CancellationPolicy.State;
import academy.testing.CancellationPolicy.Decision;

class CancellationPolicyTest {
    private final CancellationPolicy policy = new CancellationPolicy();

    @ParameterizedTest(name = "{0} produces {1}")
    @CsvSource({"CREATED,CANCEL", "CLAIMED,TOO_LATE",
                "CANCELLED,ALREADY_CANCELLED"})
    void decidesFromTheCurrentState(State state, Decision expected) {
        assertEquals(expected, policy.decide(state));
    }

    @Test
    void rejectsMissingState() {
        var error = assertThrows(NullPointerException.class,
                () -> policy.decide(null));
        assertEquals("state", error.getMessage());
    }
}
