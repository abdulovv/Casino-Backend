package com.casino.upgrader_service.services;

import com.casino.upgrader_service.exceptions.InvalidUpgradeTargetException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;

@Component
public class UpgradeChanceCalculator {
    public static final int PROBABILITY_SCALE = 1_000_000;
    private static final int BASIS_POINTS_SCALE = 10_000;

    private final int houseEdgeBps;

    public UpgradeChanceCalculator(
            @Value("${upgrader.house-edge-bps}") int houseEdgeBps
    ) {
        if (houseEdgeBps < 0 || houseEdgeBps >= BASIS_POINTS_SCALE) {
            throw new IllegalArgumentException(
                    "upgrader.house-edge-bps must be between 0 and 9999"
            );
        }
        this.houseEdgeBps = houseEdgeBps;
    }

    public int calculateChancePpm(long sourcePrice, long targetPrice) {
        if (sourcePrice <= 0 || targetPrice <= 0) {
            throw new InvalidUpgradeTargetException(
                    "Source and target prices must be positive"
            );
        }
        if (targetPrice <= sourcePrice) {
            throw new InvalidUpgradeTargetException(
                    "Target item must be more expensive than source item"
            );
        }

        BigInteger numerator = BigInteger.valueOf(sourcePrice)
                .multiply(BigInteger.valueOf(BASIS_POINTS_SCALE - houseEdgeBps))
                .multiply(BigInteger.valueOf(PROBABILITY_SCALE));
        BigInteger denominator = BigInteger.valueOf(targetPrice)
                .multiply(BigInteger.valueOf(BASIS_POINTS_SCALE));

        int chancePpm = numerator.divide(denominator).intValue();
        if (chancePpm <= 0) {
            throw new InvalidUpgradeTargetException(
                    "Calculated upgrade chance is too small"
            );
        }
        return chancePpm;
    }
}
