package com.casino.user_service.dto;

/**
 * Ответ после успешной продажи конкретного экземпляра предмета.
 *
 * TODO:
 * 1. inventoryItemId — id строки из inventory_items, а не id типа предмета.
 * 2. itemId — id типа предмета из каталога cases_service.
 * 3. creditedAmount — сумма, реально начисленная пользователю.
 * 4. balance — итоговый баланс после продажи.
 */
public record SellInventoryItemResponse(
        Long inventoryItemId,
        Long itemId,
        Long creditedAmount,
        Long balance
) {
}
