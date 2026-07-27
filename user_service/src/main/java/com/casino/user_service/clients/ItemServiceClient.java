package com.casino.user_service.clients;

import com.casino.user_service.clients.dto.ItemResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "item-service",
        url = "${services.item-service.url}"
)
public interface ItemServiceClient {

    @GetMapping("/api/items/{itemId}")
    ItemResponse getItemById(@PathVariable Long itemId);
}
