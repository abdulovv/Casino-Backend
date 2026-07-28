package com.casino.upgrader_service.services;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class SecureRollGenerator {
    private final SecureRandom secureRandom = new SecureRandom();

    public int nextRollPpm() {
        return secureRandom.nextInt(UpgradeChanceCalculator.PROBABILITY_SCALE);
    }
}
