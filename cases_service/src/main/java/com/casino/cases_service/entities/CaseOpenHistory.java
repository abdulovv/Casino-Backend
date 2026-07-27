package com.casino.cases_service.entities;

import com.casino.cases_service.clients.dto.ItemResponse;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "case_open_history")
@Getter
@Setter
@NoArgsConstructor
public class CaseOpenHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private Long price;

    @Column(name = "opened_at", nullable = false, updatable = false)
    private Instant openedAt;

    public static CaseOpenHistory fromItem(ItemResponse item) {
        CaseOpenHistory history = new CaseOpenHistory();
        history.setItemId(item.id());
        history.setItemName(item.name());
        history.setImageUrl(item.imageUrl());
        history.setPrice(item.price());
        history.setOpenedAt(Instant.now());
        return history;
    }
}
