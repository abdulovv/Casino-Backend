package com.casino.user_service.exceptions;

public class InventoryItemNotFoundException extends RuntimeException {

    public InventoryItemNotFoundException(Long inventoryItemId) {
        super("Inventory item not found: " + inventoryItemId);
    }
}
