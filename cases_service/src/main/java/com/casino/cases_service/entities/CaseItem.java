package com.casino.cases_service.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "case_items",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"case_id", "item_id"})}
)
@Getter
@Setter
@NoArgsConstructor
public class CaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private GameCase gameCase;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(nullable = false)
    private Integer weight;
}
