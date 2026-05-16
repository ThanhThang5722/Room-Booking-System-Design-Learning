package com.booking.domain.booking;

import com.booking.domain.booking.dto.BookingResponse;
import com.booking.domain.booking.dto.CreateBookingRequest;
import com.booking.domain.booking.event.BookingCreatedEvent;
import com.booking.domain.room.Room;
import com.booking.domain.room.RoomRepository;
import com.booking.shared.exception.RoomAlreadyBookedException;
import com.booking.shared.exception.RoomNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Tách riêng phần transactional của BookingService để tránh self-invocation problem
 * của Spring AOP proxy.
 */
@Component
public class BookingTransactionalOps {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final ApplicationEventPublisher eventPublisher;

    public BookingTransactionalOps(BookingRepository bookingRepository,
                                   RoomRepository roomRepository,
                                   ApplicationEventPublisher eventPublisher) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public BookingResponse createInTx(UUID userId, CreateBookingRequest request) {
        // LAYER 2: SELECT ... FOR UPDATE
        Room room = roomRepository.findByIdWithLock(request.roomId())
                .orElseThrow(() -> new RoomNotFoundException(request.roomId()));

        if (room.getStatus() != Room.Status.AVAILABLE) {
            throw new RoomAlreadyBookedException();
        }

        if (bookingRepository.existsOverlappingByStatus(
                request.roomId(), Booking.Status.CONFIRMED,
                request.checkIn(), request.checkOut())) {
            throw new RoomAlreadyBookedException();
        }

        long nights = ChronoUnit.DAYS.between(request.checkIn(), request.checkOut());
        BigDecimal total = room.getPricePerNight().multiply(BigDecimal.valueOf(nights));

        Booking booking = Booking.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .roomId(request.roomId())
                .checkIn(request.checkIn())
                .checkOut(request.checkOut())
                .totalPrice(total)
                .status(Booking.Status.CONFIRMED)
                .build();

        // LAYER 3 kích hoạt nếu có overlap → DataIntegrityViolationException
        bookingRepository.save(booking);
        bookingRepository.flush();

        // Publish Spring event. @TransactionalEventListener(AFTER_COMMIT) sẽ chỉ
        // bắt event này sau khi transaction commit thành công — đảm bảo
        // RabbitMQ không nhận "ghost event" nếu rollback.
        eventPublisher.publishEvent(new BookingCreatedEvent(
                booking.getId(),
                booking.getUserId(),
                booking.getRoomId(),
                booking.getCheckIn(),
                booking.getCheckOut(),
                booking.getTotalPrice(),
                Instant.now()
        ));

        return BookingResponse.from(booking);
    }
}
