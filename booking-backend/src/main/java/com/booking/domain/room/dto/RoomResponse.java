package com.booking.domain.room.dto;

import com.booking.domain.room.Room;

import java.math.BigDecimal;
import java.util.UUID;

public record RoomResponse(
        UUID id,
        String roomNumber,
        String type,
        BigDecimal pricePerNight,
        Integer capacity,
        String description,
        String status
) {
    public static RoomResponse from(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getRoomNumber(),
                room.getType().name(),
                room.getPricePerNight(),
                room.getCapacity(),
                room.getDescription(),
                room.getStatus().name()
        );
    }
}
