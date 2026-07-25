package com.casino.user_service.dto;

import com.casino.user_service.entities.Wallet;

public record WalletResponse(
        Long id,
        Long balance
) {
    public static WalletResponse mapToResponse(Wallet wallet){
        return new WalletResponse(
                wallet.getId(),
                wallet.getBalance()
        );
    }
}
