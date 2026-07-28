package com.casino.user_service.services;

import com.casino.user_service.dto.*;
import com.casino.user_service.entities.InventoryItem;
import com.casino.user_service.entities.User;
import com.casino.user_service.entities.Wallet;
import com.casino.user_service.exceptions.InsufficientBalanceException;
import com.casino.user_service.exceptions.InventoryItemNotFoundException;
import com.casino.user_service.exceptions.UserNotFoundException;
import com.casino.user_service.exceptions.WalletNotFoundException;
import com.casino.user_service.repositories.InventoryRepository;
import com.casino.user_service.repositories.UserRepository;
import com.casino.user_service.repositories.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@Service
public class InventoryService  {
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public List<InventoryItemResponse> findAllItemsByUserId(Long id) throws UserNotFoundException {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        return InventoryItemResponse.mapToResponseList(
                inventoryRepository.findAllByUserId(id)
        );
    }

    public InventoryItemResponse findItemsById(Long userId, Long inventoryItemId) {
        InventoryItem inventoryItem = inventoryRepository
                .findOneByIdAndUserId(inventoryItemId, userId)
                .orElseThrow(() ->
                        new InventoryItemNotFoundException(inventoryItemId)
                );
        return InventoryItemResponse.mapToInventoryItemResponse(inventoryItem);
    }

    @Transactional
    public InventoryItemResponse addItemToInventory(Long userId, AddInventoryItemRequest addInventoryItemRequest) throws UserNotFoundException {
        Optional<User> userOptional = userRepository.findById(userId);
        User user = userOptional.orElseThrow(() -> new UserNotFoundException(userId));

        InventoryItem newInventoryItem = new InventoryItem();
        newInventoryItem.setUser(user);
        newInventoryItem.setItemId(addInventoryItemRequest.itemId());
        inventoryRepository.save(newInventoryItem);
        return InventoryItemResponse.mapToInventoryItemResponse(newInventoryItem);
    }

    @Transactional
    public void removeItemFromInventory(
            Long userId,
            RemoveInventoryItemRequest request
    ) {
        InventoryItem inventoryItem = inventoryRepository
                .findByIdAndUserId(request.inventoryItemId(), userId)
                .orElseThrow(() ->
                        new InventoryItemNotFoundException(request.inventoryItemId())
                );
        inventoryRepository.delete(inventoryItem);
    }

    @Transactional
    public ApplyUpgradeResponse applyUpgrade(
            Long userId,
            ApplyUpgradeRequest request
    ) {
        List<Long> requestedIds = request.sourceInventoryItemIds()
                .stream()
                .distinct()
                .sorted()
                .toList();
        if (requestedIds.size() != request.sourceInventoryItemIds().size()) {
            throw new IllegalArgumentException(
                    "Stake contains duplicate inventory items"
            );
        }

        List<InventoryItem> sourceItems =
                inventoryRepository.findAllForUpgrade(userId, requestedIds);
        if (sourceItems.size() != requestedIds.size()) {
            Long missingItemId = requestedIds.stream()
                    .filter(requestedId -> sourceItems.stream()
                            .noneMatch(item -> item.getId().equals(requestedId))
                    )
                    .findFirst()
                    .orElse(requestedIds.getFirst());
            throw new InventoryItemNotFoundException(missingItemId);
        }

        List<Long> consumedInventoryItemIds = sourceItems.stream()
                .map(InventoryItem::getId)
                .toList();
        User user = sourceItems.getFirst().getUser();
        inventoryRepository.deleteAll(sourceItems);

        Long rewardInventoryItemId = null;
        if (request.success()) {
            InventoryItem rewardItem = new InventoryItem();
            rewardItem.setUser(user);
            rewardItem.setItemId(request.targetItemId());
            inventoryRepository.save(rewardItem);
            rewardInventoryItemId = rewardItem.getId();
        }

        return new ApplyUpgradeResponse(
                consumedInventoryItemIds,
                rewardInventoryItemId
        );
    }

    @Transactional
    public PurchaseInventoryItemResponse purchaseItem(
            Long userId,
            PurchaseInventoryItemRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new WalletNotFoundException(userId));

        if (wallet.getBalance() < request.amount()) {
            throw new InsufficientBalanceException(wallet.getBalance(), request.amount());
        }

        wallet.decreaseBalance(request.amount());

        InventoryItem inventoryItem = new InventoryItem();
        inventoryItem.setUser(user);
        inventoryItem.setItemId(request.itemId());
        inventoryRepository.save(inventoryItem);

        return new PurchaseInventoryItemResponse(
                inventoryItem.getId(),
                inventoryItem.getItemId(),
                wallet.getBalance()
        );
    }
}
