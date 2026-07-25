package com.casino.cases_service.exceptions;

public class IncorrectSelectRewardAlgorithmException extends RuntimeException {
    public IncorrectSelectRewardAlgorithmException(){
        super("The reward was not be selected while game case opening");
    }
}
