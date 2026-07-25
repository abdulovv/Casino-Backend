package com.casino.cases_service.controllers;

import com.casino.cases_service.dto.GameCaseResponse;
import com.casino.cases_service.services.GameCaseService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/cases")
public class GameCasesController {
    private final GameCaseService gameCaseService;

    @GetMapping
    public List<GameCaseResponse> getAllGameCases(){
        return gameCaseService.findAllGameCases();
    }

    @GetMapping("/{id}")
    public GameCaseResponse getGameCaseById(@PathVariable Long id){
        return gameCaseService.findGameCaseById(id);
    }

}
