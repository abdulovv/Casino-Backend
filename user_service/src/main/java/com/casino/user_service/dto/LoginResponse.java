package com.casino.user_service.dto;

public record LoginResponse (
    Long userId,
    String accessToken
){ }
