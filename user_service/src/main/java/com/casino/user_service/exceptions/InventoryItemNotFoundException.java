package com.casino.user_service.exceptions;

/**
 * TODO:
 * Добавь обработчик этого исключения в GlobalExceptionHandler и возвращай 404.
 * Один и тот же 404 используй и для несуществующей, и для чужой вещи:
 * так API не раскрывает наличие предметов у других пользователей.
 */
public class InventoryItemNotFoundException extends RuntimeException {

    public InventoryItemNotFoundException(Long inventoryItemId) {
        super("Inventory item not found: " + inventoryItemId);
    }
}
