package com.casino.store_service.clients;

import com.casino.store_service.clients.dto.ItemResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(
        name = "item-service",
        url = "${services.item-service.url}"
)
public interface ItemServiceClient {

    @GetMapping("/api/items")
    List<ItemResponse> getAllItems();

    @GetMapping("/api/items/{itemId}")
    ItemResponse getItemById(@PathVariable Long itemId);
}
