package com.booking.domain.booking.dto;

import com.booking.domain.booking.Booking;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID userId,
        UUID roomId,
        LocalDate checkIn,
        LocalDate checkOut,
        BigDecimal totalPrice,
        String status,
        Instant createdAt
) {
    public static BookingResponse from(Booking b) {
        return new BookingResponse(
                b.getId(),
                b.getUserId(),
                b.getRoomId(),
                b.getCheckIn(),
                b.getCheckOut(),
                b.getTotalPrice(),
                b.getStatus().name(),
                b.getCreatedAt()
        );
    }
}
