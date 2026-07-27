package com.casino.cases_service.dto;

import com.casino.cases_service.entities.GameCase;

import java.util.List;

public record GameCaseDetailsResponse(
        Long id,
        String name,
        String imageUrl,
        Long price,
        Boolean active,
        List<CaseItemResponse> items
) {
    public static GameCaseDetailsResponse mapToResponse(
            GameCase gameCase,
            List<CaseItemResponse> items
    ) {
        return new GameCaseDetailsResponse(
                gameCase.getId(),
                gameCase.getName(),
                gameCase.getImageUrl(),
                gameCase.getPrice(),
                gameCase.isActive(),
                items
        );
    }
}
