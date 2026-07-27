package com.casino.cases_service.repositories;

import com.casino.cases_service.entities.CaseOpenHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface CaseOpenHistoryRepository extends JpaRepository<CaseOpenHistory, Long> {
    List<CaseOpenHistory> findTop40ByOpenedAtBeforeOrderByOpenedAtDesc(
            Instant visibleBefore
    );
}
