package com.casino.cases_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateCaseItemRequest(
        @NotNull Long itemId,
        @NotNull @Min(1) @Max(100) Integer weight
) {
}
