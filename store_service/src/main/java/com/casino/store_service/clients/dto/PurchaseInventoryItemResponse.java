package com.casino.store_service.clients.dto;

public record PurchaseInventoryItemResponse(
        Long inventoryItemId,
        Long itemId,
        Long balance
) {
}
