package com.casino.user_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RemoveInventoryItemRequest (
        @NotNull @Positive Long inventoryItemId
){ }
