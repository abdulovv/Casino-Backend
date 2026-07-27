package com.casino.cases_service.repositories;

import com.casino.cases_service.entities.CaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseItemRepository extends JpaRepository<CaseItem, Long> {
    List<CaseItem> findAllByGameCaseId(Long caseId);
    void deleteAllByGameCaseId(Long caseId);
}
