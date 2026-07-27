package com.casino.store_service.dto;

import com.casino.store_service.clients.dto.ItemResponse;
import com.casino.store_service.clients.dto.PurchaseInventoryItemResponse;

public record StorePurchaseResponse(
        Long inventoryItemId,
        Long itemId,
        String name,
        String imageUrl,
        Long price,
        Long balance
) {
    public static StorePurchaseResponse from(
            ItemResponse item,
            PurchaseInventoryItemResponse purchase
    ) {
        return new StorePurchaseResponse(
                purchase.inventoryItemId(),
                item.id(),
                item.name(),
                item.imageUrl(),
                item.price(),
                purchase.balance()
        );
    }
}
