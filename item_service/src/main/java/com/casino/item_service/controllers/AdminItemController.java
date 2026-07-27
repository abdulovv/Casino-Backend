package com.casino.item_service.controllers;

import com.casino.item_service.dto.CreateItemRequest;
import com.casino.item_service.dto.ImageUploadResponse;
import com.casino.item_service.dto.ItemResponse;
import com.casino.item_service.dto.UpdateItemRequest;
import com.casino.item_service.services.ImageStorageService;
import com.casino.item_service.services.ItemService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/items")
@PreAuthorize("hasRole('ADMIN')")
@AllArgsConstructor
public class AdminItemController {
    private final ItemService itemService;
    private final ImageStorageService imageStorageService;

    @PostMapping
    public ItemResponse createItem(
            @Valid @RequestBody CreateItemRequest request
    ) {
        return itemService.create(request);
    }

    @PutMapping("/{itemId}")
    public ItemResponse updateItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateItemRequest request
    ) {
        return itemService.update(itemId, request);
    }

    @PostMapping(
            path = "/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ImageUploadResponse uploadImage(
            @RequestPart("file") MultipartFile file
    ) {
        return new ImageUploadResponse(imageStorageService.store(file));
    }
}
