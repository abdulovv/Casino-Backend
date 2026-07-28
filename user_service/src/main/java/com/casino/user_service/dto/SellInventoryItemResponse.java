package com.casino.user_service.dto;

public record SellInventoryItemResponse(
        Long inventoryItemId,
        Long itemId,
        Long creditedAmount,
        Long balance
) {
}
