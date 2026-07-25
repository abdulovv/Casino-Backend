package com.casino.user_service.services;

import com.casino.user_service.dto.InventoryItemResponse;
import com.casino.user_service.entities.InventoryItem;
import com.casino.user_service.exceptions.UserNotFoundException;
import com.casino.user_service.repositories.InventoryRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@Service
public class InventoryService  {
    private final InventoryRepository inventoryRepository;

    public List<InventoryItemResponse> findAllItemsByUserId(Long id) throws UserNotFoundException {
        Optional<List<InventoryItem>> inventoryItemsOptional = Optional.ofNullable(inventoryRepository.findAllByUserId(id));
        List<InventoryItem> inventoryItems = inventoryItemsOptional.orElseThrow(() -> new UserNotFoundException(id));
        return InventoryItemResponse.mapToResponseList(inventoryItems);
    }
}
