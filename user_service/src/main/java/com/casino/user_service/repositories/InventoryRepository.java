package com.casino.user_service.repositories;

import com.casino.user_service.entities.InventoryItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findAllByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<InventoryItem> findByIdAndUserId(Long id, Long userId);
}
