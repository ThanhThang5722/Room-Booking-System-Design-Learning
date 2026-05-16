package com.booking.shared.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyUsedException extends AppException {
    public EmailAlreadyUsedException(String email) {
        super(HttpStatus.CONFLICT, "EMAIL_ALREADY_USED",
                "Email đã được sử dụng: " + email);
    }
}
