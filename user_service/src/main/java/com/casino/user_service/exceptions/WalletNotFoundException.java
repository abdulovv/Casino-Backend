package com.casino.user_service.exceptions;

public class WalletNotFoundException extends Throwable {
    public WalletNotFoundException(Long id) {
        super("Wallet not found");
    }
}
