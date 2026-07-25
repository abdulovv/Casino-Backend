package com.casino.user_service.controllers;

import com.casino.user_service.dto.InventoryItemResponse;
import com.casino.user_service.exceptions.UserNotFoundException;
import com.casino.user_service.services.InventoryService;
import com.nimbusds.jwt.JWT;
import lombok.AllArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;


@AllArgsConstructor
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping
    public List<InventoryItemResponse> getInventoryItems(@AuthenticationPrincipal Jwt jwt) throws UserNotFoundException {
        Long userId = Long.valueOf(jwt.getSubject());
        return inventoryService.findAllItemsByUserId(userId);
    }
}
