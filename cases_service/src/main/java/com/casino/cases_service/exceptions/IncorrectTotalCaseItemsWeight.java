package com.casino.cases_service.exceptions;

public class IncorrectTotalCaseItemsWeight extends RuntimeException {
    public IncorrectTotalCaseItemsWeight(){
        super("Summary weight of case items isn't 1000");
    }
}
