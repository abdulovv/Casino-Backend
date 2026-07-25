package com.casino.cases_service.exceptions;

public class GameCaseNotFound extends RuntimeException {
    public GameCaseNotFound(Long id) {
        super("Game case with id " + id + " not found");
    }
}
