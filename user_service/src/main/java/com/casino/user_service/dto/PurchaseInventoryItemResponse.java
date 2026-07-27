package com.casino.user_service.dto;

public record PurchaseInventoryItemResponse(
        Long inventoryItemId,
        Long itemId,
        Long balance
) {
}
