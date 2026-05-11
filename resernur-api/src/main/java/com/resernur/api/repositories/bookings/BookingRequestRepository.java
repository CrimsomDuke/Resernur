package com.resernur.api.repositories.bookings;

import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.BookingRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRequestRepository extends JpaRepository<BookingRequest, Integer> {
    Page<BookingRequest> findAllByUserId(Integer userId, Pageable pageable);

    // Find requests for a place that overlap a given time window and have one of the provided statuses
    List<BookingRequest> findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
            Integer placeId,
            List<BookingRequestStatus> statuses,
            LocalDateTime endTime,
            LocalDateTime startTime
    );

    Page<BookingRequest> findByStatus(BookingRequestStatus status, Pageable pageable);

    //find all active request for a place
    @Query("SELECT br FROM BookingRequest br WHERE br.place.id = :placeId AND br.status IN ('PENDING', 'ACCEPTED', 'CHANGES_REQUESTED')")
    List<BookingRequest> findActiveRequestsByPlaceId(Integer placeId);
}

