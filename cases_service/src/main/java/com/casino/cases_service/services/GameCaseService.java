package com.casino.cases_service.services;

import com.casino.cases_service.dto.GameCaseResponse;
import com.casino.cases_service.entities.GameCase;
import com.casino.cases_service.exceptions.GameCaseNotFound;
import com.casino.cases_service.repositories.GameCaseRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@Service
public class GameCaseService {
    private final GameCaseRepository gameCaseRepository;

    public GameCaseResponse findGameCaseById(Long id){
        Optional<GameCase> gameCaseOptional = gameCaseRepository.findById(id);
        GameCase gameCase = gameCaseOptional.orElseThrow(()-> new GameCaseNotFound(id));
        return GameCaseResponse.mapToResponse(gameCase);
    }

    public List<GameCaseResponse> findAllGameCases() {
        List<GameCase> gameCases = gameCaseRepository.findAllByActiveTrue();
        return GameCaseResponse.mapToResponseList(gameCases);
    }
}
