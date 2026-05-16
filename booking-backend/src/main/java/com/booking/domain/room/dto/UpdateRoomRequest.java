package com.booking.domain.room.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Tất cả field optional — chỉ field nào client gửi mới được update.
 */
public record UpdateRoomRequest(
        @Pattern(regexp = "SINGLE|DOUBLE|SUITE") String type,
        @DecimalMin(value = "0.0", inclusive = false) BigDecimal pricePerNight,
        @Min(1) Integer capacity,
        @Size(max = 5000) String description,
        @Pattern(regexp = "AVAILABLE|MAINTENANCE") String status
) {
}
