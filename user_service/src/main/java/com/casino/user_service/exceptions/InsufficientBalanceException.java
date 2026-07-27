package com.casino.user_service.exceptions;

public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(Long balance, Long amount) {
        super("Insufficient balance: balance=" + balance + ", requested=" + amount);
    }
}
