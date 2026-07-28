package com.casino.upgrader_service.dto;

import java.math.BigDecimal;
import java.util.List;

public record UpgradeResponse(
        boolean success,
        BigDecimal chancePercent,
        BigDecimal rollPercent,
        List<Long> sourceInventoryItemIds,
        List<Long> sourceItemIds,
        Long targetItemId,
        Long rewardInventoryItemId,
        Long sourcePrice,
        Long targetPrice
) {
}
