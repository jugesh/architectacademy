package academy.testing;

import java.util.Objects;

public final class CancellationPolicy {
    public enum State { CREATED, CLAIMED, CANCELLED }
    public enum Decision { CANCEL, TOO_LATE, ALREADY_CANCELLED }

    public Decision decide(State state) {
        Objects.requireNonNull(state, "state");
        return switch (state) {
            case CREATED -> Decision.CANCEL;
            case CLAIMED -> Decision.TOO_LATE;
            case CANCELLED -> Decision.ALREADY_CANCELLED;
        };
    }
}
