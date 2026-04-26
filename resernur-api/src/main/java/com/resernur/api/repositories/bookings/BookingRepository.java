package com.resernur.api.repositories.bookings;

import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Integer> {
    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    Page<Booking> findByBookingRequest_User_Id(Integer userId, Pageable pageable);

    // ongoing bookings (startTime <= now and endTime >= now)
    Page<Booking> findByStartTimeLessThanEqualAndEndTimeGreaterThanEqual(LocalDateTime start, LocalDateTime end, Pageable pageable);

    // combinations
    Page<Booking> findByBookingRequest_User_IdAndStatus(Integer userId, BookingStatus status, Pageable pageable);

    Page<Booking> findByBookingRequest_User_IdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(Integer userId, LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Booking> findByStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(BookingStatus status, LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<Booking> findByBookingRequest_User_IdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(Integer userId, BookingStatus status, LocalDateTime start, LocalDateTime end, Pageable pageable);

    @Query("SELECT b FROM Booking b WHERE b.startTime >= :from AND b.endTime <= :to")
    List<Booking> findAllByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime >= :from AND b.endTime <= :to")
    List<Booking> findAllByStatusAndDateRange(@Param("status") BookingStatus status, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT b.place.id, COUNT(b.id) FROM Booking b WHERE b.status = :status AND b.startTime >= :from AND b.endTime <= :to GROUP BY b.place.id ORDER BY COUNT(b.id) DESC")
    List<Object[]> findMostUsedPlaces(@Param("status") BookingStatus status, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT b FROM Booking b WHERE (b.status = 'CANCELLED' OR b.status = 'REJECTED') AND b.startTime >= :from AND b.endTime <= :to")
    List<Booking> findCancelledOrRejected(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT b FROM Booking b " +
            "WHERE (:status IS NULL OR b.status = :status) " +
            "AND (:userId IS NULL OR b.bookingRequest.user.id = :userId) " +
            "AND (:isOngoing = false OR (b.startTime <= :now AND b.endTime >= :now))")
    Page<Booking> findByDynamicFilters(
            @Param("status") BookingStatus status,
            @Param("userId") Integer userId,
            @Param("isOngoing") boolean isOngoing,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );
}
