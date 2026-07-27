package com.casino.user_service.controllers;

import com.casino.user_service.dto.AddInventoryItemRequest;
import com.casino.user_service.dto.InventoryItemResponse;
import com.casino.user_service.dto.PurchaseInventoryItemRequest;
import com.casino.user_service.dto.PurchaseInventoryItemResponse;
import com.casino.user_service.services.InternalApiAuthorizer;
import com.casino.user_service.services.InventoryService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/inventory")
@AllArgsConstructor
public class InternalInventoryController {
    public static final String INTERNAL_TOKEN_HEADER = "X-Internal-Token";

    private final InventoryService inventoryService;
    private final InternalApiAuthorizer internalApiAuthorizer;

    @PostMapping
    public InventoryItemResponse addInventoryItem(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(INTERNAL_TOKEN_HEADER) String internalToken,
            @Valid @RequestBody AddInventoryItemRequest request
    ) {
        internalApiAuthorizer.authorize(internalToken);
        Long userId = Long.valueOf(jwt.getSubject());
        return inventoryService.addItemToInventory(userId, request);
    }

    @PostMapping("/purchase")
    public PurchaseInventoryItemResponse purchaseInventoryItem(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(INTERNAL_TOKEN_HEADER) String internalToken,
            @Valid @RequestBody PurchaseInventoryItemRequest request
    ) {
        internalApiAuthorizer.authorize(internalToken);
        Long userId = Long.valueOf(jwt.getSubject());
        return inventoryService.purchaseItem(userId, request);
    }
}
