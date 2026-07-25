package com.casino.user_service.controllers;

import com.casino.user_service.dto.WalletResponse;
import com.casino.user_service.exceptions.WalletNotFoundException;
import com.casino.user_service.services.WalletService;
import lombok.AllArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/wallet")
public class WalletController {
    private final WalletService walletService;

    @GetMapping
    public WalletResponse getWallet(@AuthenticationPrincipal Jwt jwt) throws WalletNotFoundException {
        Long userId = Long.valueOf(jwt.getSubject());
        return walletService.findWalletByUserId(userId);
    }
}
