package com.casino.cases_service.clients.dto;

public record PurchaseInventoryItemRequest(
        Long itemId,
        Long amount
) {
}
