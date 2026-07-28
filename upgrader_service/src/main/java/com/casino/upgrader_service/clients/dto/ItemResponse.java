package com.casino.upgrader_service.clients.dto;

public record ItemResponse(
        Long id,
        String name,
        String imageUrl,
        Long price
) {
}
