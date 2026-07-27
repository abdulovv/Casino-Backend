package com.casino.store_service.clients.dto;

public record PurchaseInventoryItemRequest(
        Long itemId,
        Long amount
) {
}
