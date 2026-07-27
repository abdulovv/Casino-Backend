package com.casino.cases_service.exceptions;

public class ImageNotFoundException extends RuntimeException {

    public ImageNotFoundException() {
        super("Image not found");
    }
}
