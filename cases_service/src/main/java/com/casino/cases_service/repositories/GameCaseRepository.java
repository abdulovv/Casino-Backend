package com.casino.cases_service.repositories;

import com.casino.cases_service.entities.GameCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameCaseRepository extends JpaRepository<GameCase, Long> {
    List<GameCase> findAllByActiveTrue();

    Optional<GameCase> findByIdAndActiveTrue(Long id);
}
