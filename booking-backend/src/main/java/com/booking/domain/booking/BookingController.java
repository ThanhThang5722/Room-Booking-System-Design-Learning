package com.booking.domain.booking;

import com.booking.domain.booking.dto.BookingResponse;
import com.booking.domain.booking.dto.CreateBookingRequest;
import com.booking.infrastructure.security.CurrentUser;
import com.booking.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * Endpoint quan trọng nhất — concurrent-safe nhờ 3 lớp lock.
     *
     * HTTP status code:
     *   201 Created             → đặt thành công
     *   400 Bad Request         → dates không hợp lệ
     *   401 Unauthorized        → thiếu JWT
     *   404 Not Found           → roomId không tồn tại
     *   409 Conflict            → đã có booking overlap (cả 3 layer đều trả về 409)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> create(@Valid @RequestBody CreateBookingRequest request) {
        UUID userId = CurrentUser.requireUserId();
        BookingResponse body = bookingService.createBooking(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(body));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> listMine() {
        UUID userId = CurrentUser.requireUserId();
        return ResponseEntity.ok(ApiResponse.ok(bookingService.listByUser(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getById(@PathVariable UUID id) {
        UUID userId = CurrentUser.requireUserId();
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getById(id, userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable UUID id) {
        UUID userId = CurrentUser.requireUserId();
        bookingService.cancel(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
