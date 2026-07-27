package com.casino.item_service.controllers;

import com.casino.item_service.services.ImageStorageService;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/items/images")
@AllArgsConstructor
public class ItemImageController {
    private final ImageStorageService imageStorageService;

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> getImage(
            @PathVariable String fileName
    ) {
        return ResponseEntity.ok()
                .contentType(imageStorageService.contentType(fileName))
                .body(imageStorageService.load(fileName));
    }
}
