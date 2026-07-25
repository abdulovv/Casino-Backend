package com.casino.user_service.exceptions;

public class UserNotFoundException extends Throwable {
    public UserNotFoundException(Long id){
        super("User not found with id " + id);
    }

    public UserNotFoundException(String email){
        super("User not found with email " + email);
    }
}
