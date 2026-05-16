package com.booking.shared.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class BookingNotFoundException extends AppException {
    public BookingNotFoundException(UUID id) {
        super(HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND",
                "Không tìm thấy booking với id: " + id);
    }
}
