package com.casino.cases_service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateGameCaseRequest(
        @NotBlank
        @Size(max = 255)
        String name,

        @NotBlank
        @Size(max = 1000)
        String imageUrl,

        @NotNull
        @PositiveOrZero
        Long price,

        @NotNull
        Boolean active,

        @NotEmpty
        List<@Valid CreateCaseItemRequest> items
) {
}
