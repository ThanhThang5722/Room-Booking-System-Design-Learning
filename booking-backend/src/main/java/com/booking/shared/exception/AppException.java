package com.booking.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Base exception cho domain errors — luôn đi kèm HTTP status để
 * GlobalExceptionHandler map sang response chuẩn.
 */
public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AppException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
