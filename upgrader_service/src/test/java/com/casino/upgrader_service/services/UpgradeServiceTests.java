package com.casino.upgrader_service.services;

import com.casino.upgrader_service.clients.ItemServiceClient;
import com.casino.upgrader_service.clients.UserServiceClient;
import com.casino.upgrader_service.clients.dto.ApplyUpgradeRequest;
import com.casino.upgrader_service.clients.dto.ApplyUpgradeResponse;
import com.casino.upgrader_service.clients.dto.InventoryItemResponse;
import com.casino.upgrader_service.clients.dto.ItemResponse;
import com.casino.upgrader_service.dto.UpgradeRequest;
import com.casino.upgrader_service.dto.UpgradeResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UpgradeServiceTests {

    @Test
    void successfulUpgradeConsumesSourceAndReturnsReward() {
        ItemServiceClient itemServiceClient = mock(ItemServiceClient.class);
        UserServiceClient userServiceClient = mock(UserServiceClient.class);
        UpgradeChanceCalculator calculator = mock(UpgradeChanceCalculator.class);
        SecureRollGenerator rollGenerator = mock(SecureRollGenerator.class);
        UpgradeService service = new UpgradeService(
                itemServiceClient,
                userServiceClient,
                calculator,
                rollGenerator,
                "internal-token"
        );

        when(userServiceClient.getInventoryItem("Bearer token", 50L))
                .thenReturn(new InventoryItemResponse(50L, 1L));
        when(userServiceClient.getInventoryItem("Bearer token", 51L))
                .thenReturn(new InventoryItemResponse(51L, 3L));
        when(itemServiceClient.getItemById(1L))
                .thenReturn(new ItemResponse(1L, "Source A", "a.png", 200L));
        when(itemServiceClient.getItemById(3L))
                .thenReturn(new ItemResponse(3L, "Source B", "b.png", 169L));
        when(itemServiceClient.getItemById(2L))
                .thenReturn(new ItemResponse(2L, "Target", "target.png", 648L));
        when(calculator.calculateChancePpm(369L, 648L))
                .thenReturn(512_500);
        when(rollGenerator.nextRollPpm()).thenReturn(200_000);
        when(userServiceClient.applyUpgrade(
                "Bearer token",
                "internal-token",
                new ApplyUpgradeRequest(List.of(50L, 51L), 2L, true)
        )).thenReturn(new ApplyUpgradeResponse(List.of(50L, 51L), 77L));

        UpgradeResponse response = service.upgrade(
                "Bearer token",
                new UpgradeRequest(List.of(50L, 51L), 2L)
        );

        assertThat(response.success()).isTrue();
        assertThat(response.chancePercent())
                .isEqualByComparingTo(new BigDecimal("51.2500"));
        assertThat(response.rollPercent())
                .isEqualByComparingTo(new BigDecimal("20.0000"));
        assertThat(response.rewardInventoryItemId()).isEqualTo(77L);
        verify(userServiceClient).applyUpgrade(
                "Bearer token",
                "internal-token",
                new ApplyUpgradeRequest(List.of(50L, 51L), 2L, true)
        );
    }
}
