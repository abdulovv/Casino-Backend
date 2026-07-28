package com.casino.upgrader_service.services;

import com.casino.upgrader_service.clients.ItemServiceClient;
import com.casino.upgrader_service.clients.UserServiceClient;
import com.casino.upgrader_service.clients.dto.ApplyUpgradeRequest;
import com.casino.upgrader_service.clients.dto.ApplyUpgradeResponse;
import com.casino.upgrader_service.clients.dto.InventoryItemResponse;
import com.casino.upgrader_service.clients.dto.ItemResponse;
import com.casino.upgrader_service.dto.UpgradeRequest;
import com.casino.upgrader_service.dto.UpgradeResponse;
import com.casino.upgrader_service.exceptions.InvalidUpgradeTargetException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class UpgradeService {
    private final ItemServiceClient itemServiceClient;
    private final UserServiceClient userServiceClient;
    private final UpgradeChanceCalculator chanceCalculator;
    private final SecureRollGenerator rollGenerator;
    private final String internalToken;

    public UpgradeService(
            ItemServiceClient itemServiceClient,
            UserServiceClient userServiceClient,
            UpgradeChanceCalculator chanceCalculator,
            SecureRollGenerator rollGenerator,
            @Value("${services.internal-token}") String internalToken
    ) {
        this.itemServiceClient = itemServiceClient;
        this.userServiceClient = userServiceClient;
        this.chanceCalculator = chanceCalculator;
        this.rollGenerator = rollGenerator;
        this.internalToken = internalToken;
    }

    public UpgradeResponse upgrade(
            String authorization,
            UpgradeRequest upgradeRequest
    ) {
        List<Long> sourceInventoryItemIds =
                upgradeRequest.sourceInventoryItemIds();
        if (sourceInventoryItemIds.stream().distinct().count()
                != sourceInventoryItemIds.size()) {
            throw new InvalidUpgradeTargetException(
                    "Stake contains duplicate inventory items"
            );
        }

        List<InventoryItemResponse> inventoryItems =
                sourceInventoryItemIds.stream()
                        .map(inventoryItemId ->
                                userServiceClient.getInventoryItem(
                                        authorization,
                                        inventoryItemId
                                )
                        )
                        .toList();
        List<ItemResponse> sourceItems = inventoryItems.stream()
                .map(inventoryItem ->
                        itemServiceClient.getItemById(inventoryItem.item_id())
                )
                .toList();
        ItemResponse targetItem =
                itemServiceClient.getItemById(upgradeRequest.targetItemId());
        long sourcePrice = sourceItems.stream()
                .map(ItemResponse::price)
                .reduce(0L, Math::addExact);

        int chancePpm = chanceCalculator.calculateChancePpm(
                sourcePrice,
                targetItem.price()
        );
        int rollPpm = rollGenerator.nextRollPpm();
        boolean success = rollPpm < chancePpm;

        ApplyUpgradeResponse inventoryResult = userServiceClient.applyUpgrade(
                authorization,
                internalToken,
                new ApplyUpgradeRequest(
                        inventoryItems.stream()
                                .map(InventoryItemResponse::id)
                                .toList(),
                        targetItem.id(),
                        success
                )
        );

        return new UpgradeResponse(
                success,
                toPercent(chancePpm),
                toPercent(rollPpm),
                inventoryResult.consumedInventoryItemIds(),
                sourceItems.stream().map(ItemResponse::id).toList(),
                targetItem.id(),
                inventoryResult.rewardInventoryItemId(),
                sourcePrice,
                targetItem.price()
        );
    }

    private BigDecimal toPercent(int ppm) {
        return BigDecimal.valueOf(ppm, 4);
    }
}
