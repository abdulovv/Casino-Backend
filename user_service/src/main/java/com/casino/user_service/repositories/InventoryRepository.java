package com.casino.user_service.repositories;

import com.casino.user_service.entities.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findAllByUserId(Long userId);
}
