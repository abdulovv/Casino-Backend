package com.casino.cases_service.dto;

import com.casino.cases_service.entities.GameCase;

public record AdminGameCaseResponse(
        Long id,
        String name,
        String imageUrl,
        Long price,
        Boolean active
) {
    public static AdminGameCaseResponse mapToResponse(GameCase gameCase) {
        return new AdminGameCaseResponse(
                gameCase.getId(),
                gameCase.getName(),
                gameCase.getImageUrl(),
                gameCase.getPrice(),
                gameCase.isActive()
        );
    }
}
