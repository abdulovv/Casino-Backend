package com.casino.cases_service.services;

import com.casino.cases_service.clients.UserServiceClient;
import com.casino.cases_service.clients.ItemServiceClient;
import com.casino.cases_service.clients.dto.ItemResponse;
import com.casino.cases_service.clients.dto.PurchaseInventoryItemRequest;
import com.casino.cases_service.clients.dto.PurchaseInventoryItemResponse;
import com.casino.cases_service.dto.CaseItemResponse;
import com.casino.cases_service.dto.GameCaseDetailsResponse;
import com.casino.cases_service.dto.GameCaseResponse;
import com.casino.cases_service.dto.OpenCaseResponse;
import com.casino.cases_service.dto.RecentDropResponse;
import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.entities.CaseOpenHistory;
import com.casino.cases_service.entities.GameCase;
import com.casino.cases_service.exceptions.GameCaseNotFound;
import com.casino.cases_service.repositories.CaseItemRepository;
import com.casino.cases_service.repositories.CaseOpenHistoryRepository;
import com.casino.cases_service.repositories.GameCaseRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@Slf4j
public class GameCaseService {
    private final GameCaseRepository gameCaseRepository;
    private final CaseItemRepository caseItemRepository;
    private final CaseOpenHistoryRepository caseOpenHistoryRepository;
    private final RewardSelectionService rewardSelectionService;
    private final UserServiceClient userServiceClient;
    private final ItemServiceClient itemServiceClient;
    private final String internalToken;

    public GameCaseService(
            GameCaseRepository gameCaseRepository,
            CaseItemRepository caseItemRepository,
            CaseOpenHistoryRepository caseOpenHistoryRepository,
            RewardSelectionService rewardSelectionService,
            UserServiceClient userServiceClient,
            ItemServiceClient itemServiceClient,
            @Value("${services.internal-token}") String internalToken
    ) {
        this.gameCaseRepository = gameCaseRepository;
        this.caseItemRepository = caseItemRepository;
        this.caseOpenHistoryRepository = caseOpenHistoryRepository;
        this.rewardSelectionService = rewardSelectionService;
        this.userServiceClient = userServiceClient;
        this.itemServiceClient = itemServiceClient;
        this.internalToken = internalToken;
    }

    public GameCaseDetailsResponse findGameCaseById(Long id) {
        GameCase gameCase = gameCaseRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() -> new GameCaseNotFound(id));
        List<CaseItem> caseItems = caseItemRepository.findAllByGameCaseId(id);
        List<CaseItemResponse> itemResponses = caseItems.stream()
                .map(caseItem -> CaseItemResponse.mapToResponse(
                        caseItem,
                        itemServiceClient.getItemById(caseItem.getItemId())
                ))
                .toList();
        return GameCaseDetailsResponse.mapToResponse(gameCase, itemResponses);
    }

    public List<GameCaseResponse> findAllGameCases() {
        List<GameCase> gameCases = gameCaseRepository.findAllByActiveTrue();
        return GameCaseResponse.mapToResponseList(gameCases);
    }

    public List<RecentDropResponse> findRecentDrops() {
        Instant visibleBefore = Instant.now().minusSeconds(20);
        return caseOpenHistoryRepository
                .findTop40ByOpenedAtBeforeOrderByOpenedAtDesc(visibleBefore)
                .stream()
                .map(RecentDropResponse::mapToResponse)
                .toList();
    }

    public OpenCaseResponse openGameCase(Long id, String authorization) {
        GameCase gameCase = gameCaseRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() -> new GameCaseNotFound(id));
        List<CaseItem> caseItems = caseItemRepository.findAllByGameCaseId(id);
        CaseItem reward = rewardSelectionService.selectReward(caseItems);
        ItemResponse item = itemServiceClient.getItemById(reward.getItemId());

        PurchaseInventoryItemResponse purchase = userServiceClient.purchaseItem(
                authorization,
                internalToken,
                new PurchaseInventoryItemRequest(item.id(), gameCase.getPrice())
        );

        try {
            caseOpenHistoryRepository.save(CaseOpenHistory.fromItem(item));
        } catch (RuntimeException exception) {
            log.warn("Could not save recent case drop for item {}", item.id(), exception);
        }

        return OpenCaseResponse.mapToResponse(item, purchase.inventoryItemId());
    }
}
