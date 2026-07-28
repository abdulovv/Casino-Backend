package com.casino.upgrader_service.controllers;

import com.casino.upgrader_service.dto.UpgradeRequest;
import com.casino.upgrader_service.dto.UpgradeResponse;
import com.casino.upgrader_service.services.UpgradeService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/upgrader")
public class UpgradeController {
    private final UpgradeService upgradeService;

    @PostMapping("/upgrade")
    public UpgradeResponse upgrade(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @Valid @RequestBody UpgradeRequest upgradeRequest
    ) {
        return upgradeService.upgrade(authorization, upgradeRequest);
    }
}
