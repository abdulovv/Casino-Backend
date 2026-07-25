package com.casino.cases_service.exceptions;

public class EmptyGameCaseException extends RuntimeException {
    public EmptyGameCaseException(){
        super("Game case hasn't case items");
    }
}
