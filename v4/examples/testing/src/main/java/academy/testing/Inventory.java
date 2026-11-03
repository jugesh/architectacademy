package academy.testing;

// In-memory domain example; persistence, deduplication and locking are external.
public final class Inventory {
    private long available;

    public Inventory(long available) {
        if (available < 0) throw new IllegalArgumentException("negative stock");
        this.available = available;
    }

    public boolean reserve(long quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("positive quantity required");
        if (quantity > available) return false;
        available -= quantity;
        return true;
    }

    public long available() { return available; }
}
