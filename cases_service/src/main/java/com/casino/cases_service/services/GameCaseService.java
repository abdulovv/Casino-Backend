package com.casino.cases_service.services;

import com.casino.cases_service.dto.GameCaseDetailsResponse;
import com.casino.cases_service.dto.GameCaseResponse;
import com.casino.cases_service.dto.OpenCaseResponse;
import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.entities.GameCase;
import com.casino.cases_service.exceptions.GameCaseNotFound;
import com.casino.cases_service.repositories.CaseItemRepository;
import com.casino.cases_service.repositories.GameCaseRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@Service
public class GameCaseService {
    private final GameCaseRepository gameCaseRepository;
    private final CaseItemRepository caseItemRepository;
    private final RewardSelectionService rewardSelectionService;

    public GameCaseDetailsResponse findGameCaseById(Long id) {
        GameCase gameCase = gameCaseRepository.findById(id).orElseThrow(() -> new GameCaseNotFound(id));
        List<CaseItem> caseItems = caseItemRepository.findAllByGameCaseId(id);
        return GameCaseDetailsResponse.mapToResponse(gameCase, caseItems);
    }

    public List<GameCaseResponse> findAllGameCases() {
        List<GameCase> gameCases = gameCaseRepository.findAllByActiveTrue();
        return GameCaseResponse.mapToResponseList(gameCases);
    }

    public OpenCaseResponse openGameCase(Long id) {
        Optional<GameCase> gameCaseOptional = gameCaseRepository.findById(id);
        //строчка снизу бесполезная как буто
        GameCase gameCase = gameCaseOptional.orElseThrow(() -> new GameCaseNotFound(id));

        List<CaseItem> caseItems = caseItemRepository.findAllByGameCaseId(id);
        CaseItem reward = rewardSelectionService.selectReward(caseItems);
        return OpenCaseResponse.mapToResponse(reward);
    }
}
