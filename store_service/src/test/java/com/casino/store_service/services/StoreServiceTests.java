package com.casino.store_service.services;

import com.casino.store_service.clients.ItemServiceClient;
import com.casino.store_service.clients.UserServiceClient;
import com.casino.store_service.clients.dto.ItemResponse;
import com.casino.store_service.clients.dto.PurchaseInventoryItemRequest;
import com.casino.store_service.clients.dto.PurchaseInventoryItemResponse;
import com.casino.store_service.dto.StorePurchaseResponse;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StoreServiceTests {

    @Test
    void buyItemUsesCatalogPriceAndReturnsPurchaseResult() {
        ItemServiceClient itemServiceClient = mock(ItemServiceClient.class);
        UserServiceClient userServiceClient = mock(UserServiceClient.class);
        StoreService storeService = new StoreService(
                itemServiceClient,
                userServiceClient,
                "internal-token"
        );

        ItemResponse item = new ItemResponse(
                3L,
                "Golden Knife",
                "image",
                500L
        );
        PurchaseInventoryItemResponse purchase =
                new PurchaseInventoryItemResponse(17L, 3L, 1500L);

        when(itemServiceClient.getItemById(3L)).thenReturn(item);
        when(userServiceClient.purchaseItem(
                "Bearer token",
                "internal-token",
                new PurchaseInventoryItemRequest(3L, 500L)
        )).thenReturn(purchase);

        StorePurchaseResponse response =
                storeService.buyItem(3L, "Bearer token");

        assertThat(response).isEqualTo(new StorePurchaseResponse(
                17L,
                3L,
                "Golden Knife",
                "image",
                500L,
                1500L
        ));
        verify(userServiceClient).purchaseItem(
                "Bearer token",
                "internal-token",
                new PurchaseInventoryItemRequest(3L, 500L)
        );
    }
}
