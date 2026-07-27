package com.casino.cases_service.dto;

import com.casino.cases_service.entities.CaseOpenHistory;

import java.time.Instant;

public record RecentDropResponse(
        Long id,
        Long itemId,
        String name,
        String imageUrl,
        Long price,
        Instant openedAt
) {
    public static RecentDropResponse mapToResponse(CaseOpenHistory history) {
        return new RecentDropResponse(
                history.getId(),
                history.getItemId(),
                history.getItemName(),
                history.getImageUrl(),
                history.getPrice(),
                history.getOpenedAt()
        );
    }
}
