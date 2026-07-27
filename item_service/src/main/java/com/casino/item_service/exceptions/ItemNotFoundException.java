package com.casino.item_service.exceptions;

public class ItemNotFoundException extends RuntimeException {

    public ItemNotFoundException(Long itemId) {
        super("Item not found with id " + itemId);
    }
}
