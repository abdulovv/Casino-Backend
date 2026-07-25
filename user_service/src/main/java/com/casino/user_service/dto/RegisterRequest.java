package com.casino.user_service.dto;

public record RegisterRequest(
    String email,
    String password
){}
