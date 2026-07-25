package com.casino.cases_service.dto;

import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.entities.Item;

public record OpenCaseResponse(
        Long itemId,
        String name,
        String imageUrl,
        Long price
) {
    public static OpenCaseResponse mapToResponse(CaseItem reward) {
        Item item = reward.getItem();

        return new OpenCaseResponse(
                item.getId(),
                item.getName(),
                item.getImageUrl(),
                item.getPrice()
        );
    }
}
