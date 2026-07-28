package com.casino.user_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddInventoryItemRequest (
        @NotNull @Positive Long itemId
){
}
