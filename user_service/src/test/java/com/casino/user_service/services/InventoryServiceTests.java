package com.casino.user_service.services;

import com.casino.user_service.dto.ApplyUpgradeRequest;
import com.casino.user_service.dto.ApplyUpgradeResponse;
import com.casino.user_service.dto.InventoryItemResponse;
import com.casino.user_service.entities.InventoryItem;
import com.casino.user_service.entities.User;
import com.casino.user_service.repositories.InventoryRepository;
import com.casino.user_service.repositories.UserRepository;
import com.casino.user_service.repositories.WalletRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventoryServiceTests {

    @Test
    void readsOnlyInventoryItemOwnedByCurrentUserWithoutWriteLock() {
        InventoryRepository inventoryRepository =
                mock(InventoryRepository.class);
        InventoryService service = new InventoryService(
                inventoryRepository,
                mock(UserRepository.class),
                mock(WalletRepository.class)
        );

        InventoryItem inventoryItem = new InventoryItem();
        inventoryItem.setId(15L);
        inventoryItem.setItemId(3L);
        when(inventoryRepository.findOneByIdAndUserId(15L, 7L))
                .thenReturn(Optional.of(inventoryItem));

        InventoryItemResponse response =
                service.findItemsById(7L, 15L);

        assertThat(response).isEqualTo(new InventoryItemResponse(15L, 3L));
        verify(inventoryRepository).findOneByIdAndUserId(15L, 7L);
    }

    @Test
    void successfulUpgradeConsumesOwnedItemsAndAddsRewardAtomically() {
        InventoryRepository inventoryRepository =
                mock(InventoryRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        WalletRepository walletRepository = mock(WalletRepository.class);
        InventoryService service = new InventoryService(
                inventoryRepository,
                userRepository,
                walletRepository
        );

        User user = new User();
        InventoryItem firstSourceItem = new InventoryItem();
        firstSourceItem.setId(15L);
        firstSourceItem.setItemId(3L);
        firstSourceItem.setUser(user);
        InventoryItem secondSourceItem = new InventoryItem();
        secondSourceItem.setId(16L);
        secondSourceItem.setItemId(4L);
        secondSourceItem.setUser(user);

        when(inventoryRepository.findAllForUpgrade(
                7L,
                List.of(15L, 16L)
        )).thenReturn(List.of(firstSourceItem, secondSourceItem));
        doAnswer(invocation -> {
            InventoryItem savedItem = invocation.getArgument(0);
            savedItem.setId(44L);
            return savedItem;
        }).when(inventoryRepository).save(org.mockito.ArgumentMatchers.any());

        ApplyUpgradeResponse response = service.applyUpgrade(
                7L,
                new ApplyUpgradeRequest(List.of(15L, 16L), 9L, true)
        );

        assertThat(response)
                .isEqualTo(new ApplyUpgradeResponse(
                        List.of(15L, 16L),
                        44L
                ));
        verify(inventoryRepository).deleteAll(
                List.of(firstSourceItem, secondSourceItem)
        );

        ArgumentCaptor<InventoryItem> rewardCaptor =
                ArgumentCaptor.forClass(InventoryItem.class);
        verify(inventoryRepository).save(rewardCaptor.capture());
        assertThat(rewardCaptor.getValue().getItemId()).isEqualTo(9L);
        assertThat(rewardCaptor.getValue().getUser()).isSameAs(user);
    }

    @Test
    void failedUpgradeConsumesOwnedItemWithoutAddingReward() {
        InventoryRepository inventoryRepository =
                mock(InventoryRepository.class);
        InventoryService service = new InventoryService(
                inventoryRepository,
                mock(UserRepository.class),
                mock(WalletRepository.class)
        );

        InventoryItem sourceItem = new InventoryItem();
        sourceItem.setId(15L);
        sourceItem.setUser(new User());
        when(inventoryRepository.findAllForUpgrade(7L, List.of(15L)))
                .thenReturn(List.of(sourceItem));

        ApplyUpgradeResponse response = service.applyUpgrade(
                7L,
                new ApplyUpgradeRequest(List.of(15L), 9L, false)
        );

        assertThat(response)
                .isEqualTo(new ApplyUpgradeResponse(List.of(15L), null));
        verify(inventoryRepository).deleteAll(List.of(sourceItem));
        verify(inventoryRepository, org.mockito.Mockito.never())
                .save(org.mockito.ArgumentMatchers.any());
    }
}
