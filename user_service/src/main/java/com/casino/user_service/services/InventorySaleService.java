package com.casino.user_service.services;

import com.casino.user_service.clients.ItemServiceClient;
import com.casino.user_service.clients.dto.ItemResponse;
import com.casino.user_service.dto.SellInventoryItemResponse;
import com.casino.user_service.entities.InventoryItem;
import com.casino.user_service.entities.Wallet;
import com.casino.user_service.exceptions.InventoryItemNotFoundException;
import com.casino.user_service.exceptions.WalletNotFoundException;
import com.casino.user_service.repositories.InventoryRepository;
import com.casino.user_service.repositories.WalletRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class InventorySaleService {
    private final InventoryRepository inventoryRepository;
    private final WalletRepository walletRepository;
    private final ItemServiceClient itemServiceClient;

    @Transactional
    public SellInventoryItemResponse sell(Long userId, Long inventoryItemId) {
        InventoryItem inventoryItem = inventoryRepository
                .findByIdAndUserId(inventoryItemId, userId)
                .orElseThrow(() -> new InventoryItemNotFoundException(inventoryItemId));

        ItemResponse item = itemServiceClient.getItemById(inventoryItem.getItemId());
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new WalletNotFoundException(userId));

        wallet.increaseBalance(item.price());
        inventoryRepository.delete(inventoryItem);

        return new SellInventoryItemResponse(
                inventoryItem.getId(),
                inventoryItem.getItemId(),
                item.price(),
                wallet.getBalance()
        );
    }
}
