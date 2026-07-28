package com.casino.upgrader_service.services;

import com.casino.upgrader_service.exceptions.InvalidUpgradeTargetException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UpgradeChanceCalculatorTests {

    private final UpgradeChanceCalculator calculator =
            new UpgradeChanceCalculator(1000);

    @Test
    void calculatesChanceWithHouseEdge() {
        assertThat(calculator.calculateChancePpm(369L, 648L))
                .isEqualTo(512_500);
    }

    @Test
    void rejectsTargetThatIsNotMoreExpensive() {
        assertThatThrownBy(() ->
                calculator.calculateChancePpm(500L, 500L)
        )
                .isInstanceOf(InvalidUpgradeTargetException.class)
                .hasMessageContaining("more expensive");
    }

    @Test
    void rejectsNonPositivePrices() {
        assertThatThrownBy(() ->
                calculator.calculateChancePpm(0L, 500L)
        )
                .isInstanceOf(InvalidUpgradeTargetException.class)
                .hasMessageContaining("positive");
    }
}
