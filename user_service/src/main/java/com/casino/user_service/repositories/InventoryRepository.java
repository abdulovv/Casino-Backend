package com.casino.user_service.repositories;

import com.casino.user_service.entities.InventoryItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findAllByUserId(Long userId);

    Optional<InventoryItem> findOneByIdAndUserId(Long id, Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<InventoryItem> findByIdAndUserId(Long id, Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select item
            from InventoryItem item
            where item.user.id = :userId and item.id in :inventoryItemIds
            order by item.id
            """)
    List<InventoryItem> findAllForUpgrade(
            @Param("userId") Long userId,
            @Param("inventoryItemIds") List<Long> inventoryItemIds
    );
}
