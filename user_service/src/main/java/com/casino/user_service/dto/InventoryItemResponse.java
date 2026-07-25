package com.casino.user_service.dto;

import com.casino.user_service.entities.InventoryItem;

import java.util.ArrayList;
import java.util.List;

public record InventoryItemResponse(
        Long id,
        Long item_id
) {
    static public List<InventoryItemResponse> mapToResponseList(List<InventoryItem> inventoryItems){
        List<InventoryItemResponse> finalInventoryItemResponse = new ArrayList<InventoryItemResponse>();
        for(InventoryItem item : inventoryItems){
            finalInventoryItemResponse.add(
                    new InventoryItemResponse(
                        item.getId(),
                        item.getItemId()
                    )
            );
        }
        return finalInventoryItemResponse;
    }

    public static InventoryItemResponse mapToInventoryItemResponse(InventoryItem inventoryItem){
        return new InventoryItemResponse(
                inventoryItem.getId(),
                inventoryItem.getItemId()
        );
    }
}
