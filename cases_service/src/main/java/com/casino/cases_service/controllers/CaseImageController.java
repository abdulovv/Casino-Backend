package com.casino.cases_service.controllers;

import com.casino.cases_service.services.ImageStorageService;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cases/images")
@AllArgsConstructor
public class CaseImageController {
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
