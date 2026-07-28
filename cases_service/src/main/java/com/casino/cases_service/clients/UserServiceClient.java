package com.casino.cases_service.clients;

import com.casino.cases_service.clients.dto.PurchaseInventoryItemRequest;
import com.casino.cases_service.clients.dto.PurchaseInventoryItemResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(
        name = "user-service",
        url = "${services.user-service.url}"
)
public interface UserServiceClient {

    @PostMapping("/internal/inventory/purchase")
    PurchaseInventoryItemResponse purchaseItem(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestHeader("X-Internal-Token") String internalToken,
            @RequestBody PurchaseInventoryItemRequest request
    );
}
