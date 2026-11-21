package com.app.myorbit.shared.error;

/** El cambio choca con uno más reciente que ya está guardado (HTTP 409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
