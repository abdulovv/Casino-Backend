package com.casino.user_service.dto;

import org.springframework.security.oauth2.jwt.Jwt;

public record UserResponse (
        Long id,
        String email,
        String role
){
    public static UserResponse mapToResponse(Jwt jwt){
        return new UserResponse(
                Long.valueOf(jwt.getSubject()),
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("role")
        );
    }
}
