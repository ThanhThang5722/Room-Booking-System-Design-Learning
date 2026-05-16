package com.booking.shared.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class RoomNotFoundException extends AppException {
    public RoomNotFoundException(UUID id) {
        super(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND",
                "Không tìm thấy phòng với id: " + id);
    }
}
