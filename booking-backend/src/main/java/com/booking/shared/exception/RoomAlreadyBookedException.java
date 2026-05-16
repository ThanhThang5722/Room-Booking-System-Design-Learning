package com.booking.shared.exception;

import org.springframework.http.HttpStatus;

public class RoomAlreadyBookedException extends AppException {
    public RoomAlreadyBookedException() {
        super(HttpStatus.CONFLICT, "ROOM_ALREADY_BOOKED",
                "Phòng này đã được đặt, vui lòng chọn phòng khác");
    }
}
