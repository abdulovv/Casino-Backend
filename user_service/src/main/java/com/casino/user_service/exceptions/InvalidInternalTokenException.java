package com.casino.user_service.exceptions;

public class InvalidInternalTokenException extends RuntimeException {

    public InvalidInternalTokenException() {
        super("Invalid internal service token");
    }
}
