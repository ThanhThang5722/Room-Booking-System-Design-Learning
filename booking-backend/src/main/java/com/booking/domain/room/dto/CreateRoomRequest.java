package com.booking.domain.room.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateRoomRequest(
        @NotBlank @Size(max = 20) String roomNumber,
        @NotNull @Pattern(regexp = "SINGLE|DOUBLE|SUITE") String type,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal pricePerNight,
        @NotNull @Min(1) Integer capacity,
        String description
) {
}
