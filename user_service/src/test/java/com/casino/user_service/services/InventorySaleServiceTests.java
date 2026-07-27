package com.casino.user_service.services;

import com.casino.user_service.clients.ItemServiceClient;
import com.casino.user_service.clients.dto.ItemResponse;
import com.casino.user_service.dto.SellInventoryItemResponse;
import com.casino.user_service.entities.InventoryItem;
import com.casino.user_service.entities.Wallet;
import com.casino.user_service.repositories.InventoryRepository;
import com.casino.user_service.repositories.WalletRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventorySaleServiceTests {

    @Test
    void sellRemovesOwnedInventoryItemAndCreditsCatalogPrice() {
        InventoryRepository inventoryRepository = mock(InventoryRepository.class);
        WalletRepository walletRepository = mock(WalletRepository.class);
        ItemServiceClient itemServiceClient = mock(ItemServiceClient.class);
        InventorySaleService saleService = new InventorySaleService(
                inventoryRepository,
                walletRepository,
                itemServiceClient
        );

        InventoryItem inventoryItem = new InventoryItem();
        inventoryItem.setId(12L);
        inventoryItem.setItemId(3L);

        Wallet wallet = new Wallet();
        wallet.setBalance(1000L);

        when(inventoryRepository.findByIdAndUserId(12L, 7L))
                .thenReturn(Optional.of(inventoryItem));
        when(itemServiceClient.getItemById(3L))
                .thenReturn(new ItemResponse(3L, "Golden Knife", "image", 500L));
        when(walletRepository.findByUserIdForUpdate(7L))
                .thenReturn(Optional.of(wallet));

        SellInventoryItemResponse response = saleService.sell(7L, 12L);

        assertThat(response).isEqualTo(new SellInventoryItemResponse(
                12L,
                3L,
                500L,
                1500L
        ));
        assertThat(wallet.getBalance()).isEqualTo(1500L);
        verify(inventoryRepository).delete(inventoryItem);
    }
}
