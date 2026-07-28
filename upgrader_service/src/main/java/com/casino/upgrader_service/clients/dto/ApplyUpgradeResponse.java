package com.casino.upgrader_service.clients.dto;

import java.util.List;

public record ApplyUpgradeResponse(
        List<Long> consumedInventoryItemIds,
        Long rewardInventoryItemId
) {
}
