package com.casino.upgrader_service.clients.dto;

import java.util.List;

public record ApplyUpgradeRequest(
        List<Long> sourceInventoryItemIds,
        Long targetItemId,
        boolean success
) {
}
