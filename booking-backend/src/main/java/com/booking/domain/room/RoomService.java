package com.booking.domain.room;

import com.booking.config.CacheConfig;
import com.booking.domain.booking.event.BookingCreatedEvent;
import com.booking.domain.room.dto.CreateRoomRequest;
import com.booking.domain.room.dto.RoomResponse;
import com.booking.domain.room.dto.UpdateRoomRequest;
import com.booking.shared.exception.RoomNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class RoomService {

    private static final Logger log = LoggerFactory.getLogger(RoomService.class);

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> listAll() {
        return roomRepository.findAll().stream()
                .map(RoomResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse getById(UUID id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RoomNotFoundException(id));
        return RoomResponse.from(room);
    }

    /**
     * Search phòng available — cache 60s ở Redis.
     * Key sinh ra: "rooms:available::2026-06-01_2026-06-05"
     * Lần gọi đầu: DB hit ~50ms. Các lần sau cùng key: Redis hit ~2ms.
     */
    @Cacheable(value = CacheConfig.CACHE_AVAILABLE_ROOMS,
               key = "#checkIn.toString() + '_' + #checkOut.toString()")
    @Transactional(readOnly = true)
    public List<RoomResponse> findAvailable(LocalDate checkIn, LocalDate checkOut) {
        log.debug("Cache MISS — querying DB for available rooms {} → {}", checkIn, checkOut);
        return roomRepository.findAvailable(checkIn, checkOut).stream()
                .map(RoomResponse::from)
                .toList();
    }

    @Transactional
    public RoomResponse create(CreateRoomRequest request) {
        Room room = Room.builder()
                .id(UUID.randomUUID())
                .roomNumber(request.roomNumber())
                .type(Room.Type.valueOf(request.type()))
                .pricePerNight(request.pricePerNight())
                .capacity(request.capacity())
                .description(request.description())
                .status(Room.Status.AVAILABLE)
                .version(0L)
                .build();
        roomRepository.save(room);
        return RoomResponse.from(room);
    }

    @Transactional
    public RoomResponse update(UUID id, UpdateRoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RoomNotFoundException(id));

        if (request.type() != null)          room.setType(Room.Type.valueOf(request.type()));
        if (request.pricePerNight() != null) room.setPricePerNight(request.pricePerNight());
        if (request.capacity() != null)      room.setCapacity(request.capacity());
        if (request.description() != null)   room.setDescription(request.description());
        if (request.status() != null)        room.setStatus(Room.Status.valueOf(request.status()));
        // Managed entity — JPA tự flush.
        return RoomResponse.from(room);
    }

    /**
     * Khi có booking mới → invalidate toàn bộ cache "rooms:available".
     *
     * 📚 Vì sao evict cả cache thay vì chỉ key liên quan?
     *   - Không biết chính xác key nào chứa room đó (key gồm checkIn+checkOut).
     *   - allEntries=true → DEL pattern "rooms:available::*" — đơn giản, đúng.
     *   - Trade-off: search "available" cho ngày KHÔNG liên quan cũng bị evict.
     *     Với TTL 60s, đây là noise nhỏ — chấp nhận được.
     *   - Production nếu cần fine-grained: dùng tag-based caching (Redis sets).
     *
     * Listener cùng phase AFTER_COMMIT → chỉ evict khi booking thực sự đã ghi DB.
     */
    @CacheEvict(value = CacheConfig.CACHE_AVAILABLE_ROOMS, allEntries = true)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingCreated(BookingCreatedEvent event) {
        log.debug("Evicting rooms:available cache after booking {}", event.bookingId());
    }
}
