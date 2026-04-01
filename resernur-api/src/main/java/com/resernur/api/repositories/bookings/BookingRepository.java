package com.resernur.api.repositories.bookings;

import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

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
}
