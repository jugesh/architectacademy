package academy.testing;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class InventoryExamplesTest {
    @ParameterizedTest
    @CsvSource({"10,1,true,9", "10,10,true,0", "10,11,false,10", "0,1,false,0"})
    void agreedReservationExamples(long before, long requested,
                                   boolean accepted, long after) {
        var inventory = new Inventory(before);
        assertEquals(accepted, inventory.reserve(requested));
        assertEquals(after, inventory.available());
    }

    @ParameterizedTest
    @ValueSource(longs = {0, -1, Long.MIN_VALUE})
    void invalidQuantitiesCannotChangeStock(long quantity) {
        var inventory = new Inventory(10);
        assertThrows(IllegalArgumentException.class, () -> inventory.reserve(quantity));
        assertEquals(10, inventory.available());
    }

    @Test void negativeInitialStockIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> new Inventory(-1));
    }

    @Test void sequentialBuyersCannotBothTakeTheLastUnit() {
        var inventory = new Inventory(1);
        assertTrue(inventory.reserve(1));
        assertFalse(inventory.reserve(1));
        assertEquals(0, inventory.available());
    }
}
