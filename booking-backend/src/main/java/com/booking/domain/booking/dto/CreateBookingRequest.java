package com.booking.domain.booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateBookingRequest(
        @NotNull UUID roomId,
        @NotNull @Future LocalDate checkIn,
        @NotNull @Future LocalDate checkOut
) {
}
