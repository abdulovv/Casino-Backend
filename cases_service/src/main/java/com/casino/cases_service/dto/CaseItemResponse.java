package com.casino.cases_service.dto;

import com.casino.cases_service.clients.dto.ItemResponse;
import com.casino.cases_service.entities.CaseItem;

public record CaseItemResponse(
        Long itemId,
        String name,
        String imageUrl,
        Long price,
        Integer weight
) {
    public static CaseItemResponse mapToResponse(CaseItem caseItem, ItemResponse item) {
        return new CaseItemResponse(
                item.id(),
                item.name(),
                item.imageUrl(),
                item.price(),
                caseItem.getWeight()
        );
    }
}
