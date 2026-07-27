package com.casino.user_service.dto;

import jakarta.validation.constraints.NotNull;

public record AddInventoryItemRequest (
        @NotNull Long itemId
){
}
