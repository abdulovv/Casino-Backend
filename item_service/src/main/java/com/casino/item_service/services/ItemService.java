package com.casino.item_service.services;

import com.casino.item_service.dto.CreateItemRequest;
import com.casino.item_service.dto.ItemResponse;
import com.casino.item_service.dto.UpdateItemRequest;
import com.casino.item_service.entities.Item;
import com.casino.item_service.exceptions.ItemNotFoundException;
import com.casino.item_service.repositories.ItemRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ItemService {
    private final ItemRepository itemRepository;

    public List<ItemResponse> findAll() {
        return itemRepository.findAll()
                .stream()
                .map(ItemResponse::mapToResponse)
                .toList();
    }

    public ItemResponse findById(Long itemId) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new ItemNotFoundException(itemId));
        return ItemResponse.mapToResponse(item);
    }

    public ItemResponse create(CreateItemRequest request) {
        Item item = new Item();
        item.setName(request.name());
        item.setImageUrl(request.imageUrl());
        item.setPrice(request.price());
        return ItemResponse.mapToResponse(itemRepository.save(item));
    }

    public ItemResponse update(Long itemId, UpdateItemRequest request) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        item.setName(request.name());
        item.setImageUrl(request.imageUrl());
        item.setPrice(request.price());
        return ItemResponse.mapToResponse(itemRepository.save(item));
    }
}
