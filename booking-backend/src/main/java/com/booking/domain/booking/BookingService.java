package com.booking.domain.booking;

import com.booking.domain.booking.dto.BookingResponse;
import com.booking.domain.booking.dto.CreateBookingRequest;
import com.booking.infrastructure.redis.RedisLockService;
import com.booking.shared.exception.AppException;
import com.booking.shared.exception.BookingNotFoundException;
import com.booking.shared.exception.LockAcquisitionFailedException;
import com.booking.shared.exception.RoomAlreadyBookedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * ============================================================================
 * BOOKING SERVICE — CORE CONCURRENT-SAFE LOGIC
 * ============================================================================
 *
 * Khi 2+ user click "Đặt phòng" cùng phòng + cùng ngày trong vài ms, KHÔNG có
 * cơ chế bảo vệ nào ở app layer là đủ. Phải có nhiều lớp:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ LAYER 1 — Redis Distributed Lock (SETNX)                     │
 *   │   Mục đích: reject nhanh ở edge, giảm tải DB.                │
 *   │   Cơ chế: SET key NX PX 10000 → ai set được thì xử lý tiếp.  │
 *   │   Không bảo đảm correctness (Redis có thể down giữa chừng).   │
 *   └──────────────────────────────────────────────────────────────┘
 *                              ↓ pass
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ LAYER 2 — DB Pessimistic Write Lock (SELECT FOR UPDATE)      │
 *   │   Mục đích: serialize việc đọc/ghi room row tại Postgres.    │
 *   │   Cơ chế: lock row đến khi transaction commit/rollback.      │
 *   │   Đây là tier ĐẢM BẢO correctness chính.                     │
 *   └──────────────────────────────────────────────────────────────┘
 *                              ↓ pass
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ LAYER 3 — DB EXCLUDE Constraint (no_overlap)                 │
 *   │   Mục đích: dây an toàn cuối cùng.                           │
 *   │   Phản ứng: DataIntegrityViolationException → 409.            │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * 📚 Thứ tự release lock:
 *   COMMIT transaction TRƯỚC, RỒI release Redis lock.
 *   Phương pháp ở đây: BookingService gọi BookingTransactionalOps.createInTx()
 *   → @Transactional commit khi method return → control quay về BookingService
 *   → release Redis lock trong finally.
 * ============================================================================
 */
@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private static final Duration LOCK_TTL = Duration.ofSeconds(10);

    private final BookingRepository bookingRepository;
    private final BookingTransactionalOps txOps;
    private final RedisLockService redisLockService;

    public BookingService(BookingRepository bookingRepository,
                          BookingTransactionalOps txOps,
                          RedisLockService redisLockService) {
        this.bookingRepository = bookingRepository;
        this.txOps = txOps;
        this.redisLockService = redisLockService;
    }

    public BookingResponse createBooking(UUID userId, CreateBookingRequest request) {
        validateDates(request);

        // ============ LAYER 1: Redis distributed lock ============
        String lockKey = buildLockKey(request.roomId(), request);
        String lockToken = redisLockService.tryAcquire(lockKey, LOCK_TTL);
        if (lockToken == null) {
            throw new LockAcquisitionFailedException();
        }

        try {
            // Gọi qua bean → đi qua Spring proxy → @Transactional có hiệu lực
            return txOps.createInTx(userId, request);
        } catch (DataIntegrityViolationException ex) {
            // LAYER 3 đã catch (no_overlap constraint trip).
            log.warn("Layer 3 (DB EXCLUDE constraint) triggered for room={} dates={}→{}",
                    request.roomId(), request.checkIn(), request.checkOut());
            throw new RoomAlreadyBookedException();
        } finally {
            // Release Redis lock SAU KHI transaction đã commit/rollback.
            redisLockService.release(lockKey, lockToken);
        }
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listByUser(UUID userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getById(UUID id, UUID requesterUserId) {
        Booking b = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException(id));
        if (!b.getUserId().equals(requesterUserId)) {
            throw new BookingNotFoundException(id);  // hide existence
        }
        return BookingResponse.from(b);
    }

    @Transactional
    public void cancel(UUID id, UUID requesterUserId) {
        Booking b = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException(id));
        if (!b.getUserId().equals(requesterUserId)) {
            throw new BookingNotFoundException(id);
        }
        b.setStatus(Booking.Status.CANCELLED);
    }

    // ---------- helpers ----------

    private void validateDates(CreateBookingRequest req) {
        if (!req.checkOut().isAfter(req.checkIn())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "INVALID_DATES", "check_out phải sau check_in");
        }
    }

    private String buildLockKey(UUID roomId, CreateBookingRequest req) {
        return String.format("lock:booking:room:%s:%s:%s",
                roomId, req.checkIn(), req.checkOut());
    }
}
