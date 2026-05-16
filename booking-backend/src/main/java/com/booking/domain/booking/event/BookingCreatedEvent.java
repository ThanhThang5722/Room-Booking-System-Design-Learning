package com.booking.domain.booking.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Domain event — publish trong transaction nhưng chỉ được listener xử lý
 * SAU KHI transaction commit thành công (qua @TransactionalEventListener).
 *
 * Lưu ý: chỉ chứa data cần thiết cho consumer, KHÔNG include entity JPA
 * (entity có thể detached, gây LazyInitializationException khi serialize).
 */
public record BookingCreatedEvent(
        UUID bookingId,
        UUID userId,
        UUID roomId,
        LocalDate checkIn,
        LocalDate checkOut,
        BigDecimal totalPrice,
        Instant occurredAt
) {
}
