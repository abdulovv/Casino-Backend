package com.casino.cases_service.controllers;

import com.casino.cases_service.dto.AdminGameCaseResponse;
import com.casino.cases_service.dto.CreateGameCaseRequest;
import com.casino.cases_service.dto.GameCaseDetailsResponse;
import com.casino.cases_service.dto.ImageUploadResponse;
import com.casino.cases_service.dto.UpdateGameCaseRequest;
import com.casino.cases_service.services.AdminGameCaseService;
import com.casino.cases_service.services.ImageStorageService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/cases")
@PreAuthorize("hasRole('ADMIN')")
@AllArgsConstructor
public class AdminGameCaseController {
    private final AdminGameCaseService adminGameCaseService;
    private final ImageStorageService imageStorageService;

    @GetMapping
    public List<AdminGameCaseResponse> getAllGameCases() {
        return adminGameCaseService.findAll();
    }

    @PostMapping
    public GameCaseDetailsResponse createGameCase(
            @Valid @RequestBody CreateGameCaseRequest request
    ) {
        return adminGameCaseService.create(request);
    }

    @PutMapping("/{caseId}")
    public GameCaseDetailsResponse updateGameCase(
            @PathVariable Long caseId,
            @Valid @RequestBody UpdateGameCaseRequest request
    ) {
        return adminGameCaseService.update(caseId, request);
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
