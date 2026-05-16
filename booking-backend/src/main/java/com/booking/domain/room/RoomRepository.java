package com.booking.domain.room;

import com.booking.domain.booking.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {

    /**
     * LAYER 2 — Pessimistic Write Lock.
     * SQL sinh ra: SELECT ... FROM rooms WHERE id = ? FOR UPDATE
     * BẮT BUỘC gọi trong method có @Transactional.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdWithLock(@Param("id") UUID id);

    /**
     * Search những phòng còn trống trong [checkIn, checkOut).
     * Pass enum làm parameter để tránh JPQL inner-enum syntax mismatch.
     */
    @Query("""
        SELECT r FROM Room r
        WHERE r.status = :roomStatus
          AND r.id NOT IN (
              SELECT b.roomId FROM Booking b
              WHERE b.status = :bookingStatus
                AND b.checkIn < :checkOut
                AND b.checkOut > :checkIn
          )
        ORDER BY r.roomNumber
        """)
    List<Room> findAvailableInRange(@Param("checkIn") LocalDate checkIn,
                                    @Param("checkOut") LocalDate checkOut,
                                    @Param("roomStatus") Room.Status roomStatus,
                                    @Param("bookingStatus") Booking.Status bookingStatus);

    default List<Room> findAvailable(LocalDate checkIn, LocalDate checkOut) {
        return findAvailableInRange(checkIn, checkOut,
                Room.Status.AVAILABLE, Booking.Status.CONFIRMED);
    }

    boolean existsByRoomNumber(String roomNumber);
}
