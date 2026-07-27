package com.casino.store_service.controllers;

import com.casino.store_service.clients.dto.ItemResponse;
import com.casino.store_service.dto.StorePurchaseResponse;
import com.casino.store_service.services.StoreService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/store")
@AllArgsConstructor
public class StoreController {
    private final StoreService storeService;

    @GetMapping("/items")
    public List<ItemResponse> getStoreItems() {
        return storeService.findAllItems();
    }

    @PostMapping("/items/{itemId}/buy")
    public StorePurchaseResponse buyItem(
            @PathVariable Long itemId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return storeService.buyItem(itemId, authorization);
    }
}
