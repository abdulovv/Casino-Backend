package com.casino.store_service.services;

import com.casino.store_service.clients.ItemServiceClient;
import com.casino.store_service.clients.UserServiceClient;
import com.casino.store_service.clients.dto.ItemResponse;
import com.casino.store_service.clients.dto.PurchaseInventoryItemRequest;
import com.casino.store_service.clients.dto.PurchaseInventoryItemResponse;
import com.casino.store_service.dto.StorePurchaseResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StoreService {
    private final ItemServiceClient itemServiceClient;
    private final UserServiceClient userServiceClient;
    private final String internalToken;

    public StoreService(
            ItemServiceClient itemServiceClient,
            UserServiceClient userServiceClient,
            @Value("${services.internal-token}") String internalToken
    ) {
        this.itemServiceClient = itemServiceClient;
        this.userServiceClient = userServiceClient;
        this.internalToken = internalToken;
    }

    public List<ItemResponse> findAllItems() {
        return itemServiceClient.getAllItems();
    }

    public StorePurchaseResponse buyItem(
            Long itemId,
            String authorization
    ) {
        ItemResponse item = itemServiceClient.getItemById(itemId);
        PurchaseInventoryItemRequest request =
                new PurchaseInventoryItemRequest(item.id(), item.price());
        PurchaseInventoryItemResponse purchase = userServiceClient.purchaseItem(
                authorization,
                internalToken,
                request
        );
        return StorePurchaseResponse.from(item, purchase);
    }
}
