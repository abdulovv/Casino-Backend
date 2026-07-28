package com.casino.user_service.dto;

import java.util.List;

public record ApplyUpgradeResponse(
        List<Long> consumedInventoryItemIds,
        Long rewardInventoryItemId
) {
}
