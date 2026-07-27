package com.casino.cases_service.clients;

import com.casino.cases_service.clients.dto.AddInventoryItemRequest;
import com.casino.cases_service.clients.dto.DebitWalletRequest;
import com.casino.cases_service.clients.dto.InventoryItemResponse;
import com.casino.cases_service.clients.dto.WalletResponse;
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

    @PostMapping("/api/wallet/debit")
    WalletResponse debit(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestBody DebitWalletRequest request
    );

    @PostMapping("/internal/inventory")
    InventoryItemResponse addInventoryItem(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestHeader("X-Internal-Token") String internalToken,
            @RequestBody AddInventoryItemRequest request
    );
}
