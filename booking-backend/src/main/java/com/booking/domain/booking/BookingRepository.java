package com.booking.domain.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    /**
     * Kiểm tra có booking CONFIRMED nào overlap với khoảng [checkIn, checkOut) không.
     *
     * 📚 Vì sao pass enum làm parameter thay vì hardcode trong JPQL?
     *   - Tránh sự khác biệt giữa các phiên bản Hibernate về cú pháp tham chiếu
     *     inner enum (Booking.Status vs Booking$Status).
     *   - Pass parameter → Hibernate tự handle qua type system → an toàn 100%.
     *   - "SELECT COUNT(b) > 0" có thể trả Long trong vài version → dùng CASE WHEN
     *     để chắc chắn kiểu boolean.
     */
    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Booking b
        WHERE b.roomId = :roomId
          AND b.status = :status
          AND b.checkIn < :checkOut
          AND b.checkOut > :checkIn
        """)
    boolean existsOverlappingByStatus(@Param("roomId") UUID roomId,
                                      @Param("status") Booking.Status status,
                                      @Param("checkIn") LocalDate checkIn,
                                      @Param("checkOut") LocalDate checkOut);

    List<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
