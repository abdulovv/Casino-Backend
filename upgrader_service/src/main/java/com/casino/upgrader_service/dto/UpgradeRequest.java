package com.casino.upgrader_service.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpgradeRequest(
        @NotEmpty
        @Size(max = 5)
        List<@NotNull @Positive Long> sourceInventoryItemIds,
        @NotNull @Positive Long targetItemId
) {
}
