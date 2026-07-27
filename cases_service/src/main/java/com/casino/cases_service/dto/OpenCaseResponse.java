package com.casino.cases_service.dto;

import com.casino.cases_service.clients.dto.ItemResponse;
import com.casino.cases_service.entities.CaseItem;

public record OpenCaseResponse(
        Long inventoryItemId,
        Long itemId,
        String name,
        String imageUrl,
        Long price
) {
    public static OpenCaseResponse mapToResponse(
            ItemResponse item,
            Long inventoryItemId
    ) {
        return new OpenCaseResponse(
                inventoryItemId,
                item.id(),
                item.name(),
                item.imageUrl(),
                item.price()
        );
    }
}
