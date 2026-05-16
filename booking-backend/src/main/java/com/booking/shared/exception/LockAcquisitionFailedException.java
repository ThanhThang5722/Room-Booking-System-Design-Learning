package com.booking.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Throw khi không lấy được Redis distributed lock —
 * tức là có request khác đang xử lý đúng phòng/đúng khoảng ngày này.
 */
public class LockAcquisitionFailedException extends AppException {
    public LockAcquisitionFailedException() {
        super(HttpStatus.CONFLICT, "BOOKING_IN_PROGRESS",
                "Phòng này đang được người khác đặt, vui lòng thử lại sau giây lát");
    }
}
