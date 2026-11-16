package academy.testing;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.quicktheories.QuickTheory.qt;
import static org.quicktheories.generators.SourceDSL.longs;

class InventoryPropertiesTest {
    @Test void reservingCannotCreateOrMakeNegativeStock() {
        qt().withFixedSeed(73).withExamples(1000)
            .forAll(longs().between(0, 1_000_000), longs().between(1, 1_000_000))
            .checkAssert((before, quantity) -> {
                var inventory = new Inventory(before);
                boolean accepted = inventory.reserve(quantity);
                long after = inventory.available();
                assertTrue(after >= 0 && after <= before);
                if (accepted) assertEquals(before, after + quantity);
                else assertEquals(before, after);
            });
    }

    @Test void splittingAnAffordableReservationPreservesItsTotal() {
        qt().withFixedSeed(91).withExamples(1000)
            .forAll(longs().between(1, 500_000), longs().between(1, 500_000))
            .checkAssert((first, second) -> {
                long total = first + second; // bounded generators avoid overflow
                var split = new Inventory(total);
                var combined = new Inventory(total);
                assertTrue(split.reserve(first));
                assertTrue(split.reserve(second));
                assertTrue(combined.reserve(total));
                assertEquals(combined.available(), split.available());
            });
    }
}
