package com.casino.cases_service.repositories;

import com.casino.cases_service.entities.GameCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface GameCaseRepository extends JpaRepository<GameCase, Long> {
    List<GameCase> findAllByActiveTrue();
}
