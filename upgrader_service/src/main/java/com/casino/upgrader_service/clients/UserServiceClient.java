package com.casino.upgrader_service.clients;

import com.casino.upgrader_service.clients.dto.InventoryItemResponse;
import com.casino.upgrader_service.clients.dto.ApplyUpgradeRequest;
import com.casino.upgrader_service.clients.dto.ApplyUpgradeResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(
        name = "user-service",
        url = "${services.user-service.url}"
)
public interface UserServiceClient {
    @GetMapping("/api/inventory/{inventoryItemId}")
    InventoryItemResponse getInventoryItem(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @PathVariable Long inventoryItemId
    );

    @PostMapping("/internal/inventory/upgrade")
    ApplyUpgradeResponse applyUpgrade(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestHeader("X-Internal-Token") String internalToken,
            @RequestBody ApplyUpgradeRequest request
    );
}
