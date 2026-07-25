package com.casino.cases_service.dto;

import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.entities.GameCase;

import java.util.List;

public record GameCaseDetailsResponse(
        Long id,
        String name,
        String imageUrl,
        Long price,
        List<CaseItemResponse> items
) {
    public static GameCaseDetailsResponse mapToResponse(
            GameCase gameCase,
            List<CaseItem> caseItems
    ) {
        List<CaseItemResponse> items = caseItems.stream()
                .map(CaseItemResponse::mapToResponse)
                .toList();

        return new GameCaseDetailsResponse(
                gameCase.getId(),
                gameCase.getName(),
                gameCase.getImageUrl(),
                gameCase.getPrice(),
                items
        );
    }
}
