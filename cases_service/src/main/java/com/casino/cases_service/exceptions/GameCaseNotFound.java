package com.casino.cases_service.exceptions;

public class GameCaseNotFound extends RuntimeException {
    public GameCaseNotFound(Long id) {
        super("Gamecase with id " + id + " not found");
    }
}
