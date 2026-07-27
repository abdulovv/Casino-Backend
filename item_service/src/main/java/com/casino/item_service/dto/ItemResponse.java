package com.casino.item_service.dto;

import com.casino.item_service.entities.Item;

public record ItemResponse(
        Long id,
        String name,
        String imageUrl,
        Long price
) {
    public static ItemResponse mapToResponse(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getName(),
                item.getImageUrl(),
                item.getPrice()
        );
    }
}
