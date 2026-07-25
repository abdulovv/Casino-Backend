package com.casino.user_service.dto;

public record LoginRequest(
    String password,
    String email
){}
