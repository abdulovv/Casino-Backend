package com.casino.cases_service.services;

import com.casino.cases_service.clients.ItemServiceClient;
import com.casino.cases_service.clients.UserServiceClient;
import com.casino.cases_service.clients.dto.ItemResponse;
import com.casino.cases_service.clients.dto.PurchaseInventoryItemRequest;
import com.casino.cases_service.clients.dto.PurchaseInventoryItemResponse;
import com.casino.cases_service.dto.OpenCaseResponse;
import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.entities.GameCase;
import com.casino.cases_service.repositories.CaseItemRepository;
import com.casino.cases_service.repositories.CaseOpenHistoryRepository;
import com.casino.cases_service.repositories.GameCaseRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GameCaseServiceTests {

    @Test
    void openingCasePurchasesSelectedRewardInSingleUserServiceCall() {
        GameCaseRepository gameCaseRepository = mock(GameCaseRepository.class);
        CaseItemRepository caseItemRepository = mock(CaseItemRepository.class);
        CaseOpenHistoryRepository historyRepository =
                mock(CaseOpenHistoryRepository.class);
        RewardSelectionService rewardSelectionService =
                mock(RewardSelectionService.class);
        UserServiceClient userServiceClient = mock(UserServiceClient.class);
        ItemServiceClient itemServiceClient = mock(ItemServiceClient.class);
        GameCaseService service = new GameCaseService(
                gameCaseRepository,
                caseItemRepository,
                historyRepository,
                rewardSelectionService,
                userServiceClient,
                itemServiceClient,
                "internal-token"
        );

        GameCase gameCase = new GameCase();
        gameCase.setId(4L);
        gameCase.setPrice(100L);

        CaseItem reward = new CaseItem();
        reward.setItemId(3L);
        ItemResponse item =
                new ItemResponse(3L, "Reward", "reward.png", 500L);

        when(gameCaseRepository.findByIdAndActiveTrue(4L))
                .thenReturn(Optional.of(gameCase));
        when(caseItemRepository.findAllByGameCaseId(4L))
                .thenReturn(List.of(reward));
        when(rewardSelectionService.selectReward(List.of(reward)))
                .thenReturn(reward);
        when(itemServiceClient.getItemById(3L)).thenReturn(item);
        when(userServiceClient.purchaseItem(
                "Bearer token",
                "internal-token",
                new PurchaseInventoryItemRequest(3L, 100L)
        )).thenReturn(new PurchaseInventoryItemResponse(20L, 3L, 900L));
        when(historyRepository.save(any())).thenAnswer(invocation ->
                invocation.getArgument(0)
        );

        OpenCaseResponse response =
                service.openGameCase(4L, "Bearer token");

        assertThat(response.inventoryItemId()).isEqualTo(20L);
        assertThat(response.itemId()).isEqualTo(3L);
        verify(userServiceClient).purchaseItem(
                "Bearer token",
                "internal-token",
                new PurchaseInventoryItemRequest(3L, 100L)
        );
    }
}
