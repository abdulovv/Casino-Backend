package com.casino.item_service.exceptions;

public class ImageNotFoundException extends RuntimeException {

    public ImageNotFoundException() {
        super("Image not found");
    }
}
