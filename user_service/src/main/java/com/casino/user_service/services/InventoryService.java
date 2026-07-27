package com.casino.user_service.services;

import com.casino.user_service.dto.AddInventoryItemRequest;
import com.casino.user_service.dto.InventoryItemResponse;
import com.casino.user_service.dto.PurchaseInventoryItemRequest;
import com.casino.user_service.dto.PurchaseInventoryItemResponse;
import com.casino.user_service.entities.InventoryItem;
import com.casino.user_service.entities.User;
import com.casino.user_service.entities.Wallet;
import com.casino.user_service.exceptions.InsufficientBalanceException;
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
        Optional<List<InventoryItem>> inventoryItemsOptional = Optional.ofNullable(inventoryRepository.findAllByUserId(id));
        List<InventoryItem> inventoryItems = inventoryItemsOptional.orElseThrow(() -> new UserNotFoundException(id));
        return InventoryItemResponse.mapToResponseList(inventoryItems);
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
