package com.casino.cases_service.dto;

import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.entities.Item;

public record CaseItemResponse(
        Long itemId,
        String name,
        String imageUrl,
        Long price,
        Integer weight
) {
    public static CaseItemResponse mapToResponse(CaseItem caseItem) {
        Item item = caseItem.getItem();

        return new CaseItemResponse(
                item.getId(),
                item.getName(),
                item.getImageUrl(),
                item.getPrice(),
                caseItem.getWeight()
        );
    }
}
