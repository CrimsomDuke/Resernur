package com.resernur.api.services.bookings;

import com.resernur.api.dtos.bookings.BookingDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.repositories.bookings.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    // Create a booking from an accepted BookingRequest
    @Transactional
    public StandardResult<BookingDTO> createBookingFromRequest(BookingRequest request) {
        if(request.getStatus() != BookingRequestStatus.ACCEPTED) return new StandardResult<>(false, "BookingRequest must be ACCEPTED to create a Booking", null);
        if (request == null) return new StandardResult<>(false, "BookingRequest is null", null);

        Booking b = new Booking();
        b.setBookingRequest(request);
        b.setPlace(request.getPlace());
        b.setStartTime(request.getRequestedStartTime());
        b.setEndTime(request.getRequestedEndTime());
        b.setStatus(BookingStatus.COMPLETED);
        Booking saved = bookingRepository.save(b);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    // Get booking by id
    public StandardResult<BookingDTO> getById(int id) {
        Optional<Booking> opt = bookingRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "Not found", null);
        return new StandardResult<>(true, "", toDTO(opt.get()));
    }

    // Search bookings with optional filters: status, user requester id, ongoing flag
    public PagedResponse<BookingDTO> search(SearchQuery query, BookingStatus status, Integer userId, Boolean ongoing) {
        int page = Math.max(0, query == null ? 0 : query.page);
        int pageSize = Math.max(1, query == null ? 10 : query.pageSize);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Booking> pageResult;
        LocalDateTime now = LocalDateTime.now();

        boolean isOngoing = ongoing != null && ongoing;

        if (isOngoing) {
            if (status != null && userId != null) {
                pageResult = bookingRepository.findByBookingRequest_User_IdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(userId, status, now, now, pageable);
            } else if (status != null) {
                pageResult = bookingRepository.findByStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(status, now, now, pageable);
            } else if (userId != null) {
                pageResult = bookingRepository.findByBookingRequest_User_IdAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(userId, now, now, pageable);
            } else {
                pageResult = bookingRepository.findByStartTimeLessThanEqualAndEndTimeGreaterThanEqual(now, now, pageable);
            }
        } else {
            if (status != null && userId != null) {
                pageResult = bookingRepository.findByBookingRequest_User_IdAndStatus(userId, status, pageable);
            } else if (status != null) {
                pageResult = bookingRepository.findByStatus(status, pageable);
            } else if (userId != null) {
                pageResult = bookingRepository.findByBookingRequest_User_Id(userId, pageable);
            } else {
                pageResult = bookingRepository.findAll(pageable);
            }
        }

        var content = pageResult.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PagedResponse<>(content, pageResult.getNumber(), pageResult.getSize(), pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.isLast(), true, "");
    }

    // Cancel a booking
    @Transactional
    public StandardResult<Void> cancelBooking(int id) {
        Optional<Booking> opt = bookingRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking not found", null);
        Booking b = opt.get();
        if (b.getStatus() == BookingStatus.CANCELLED) return new StandardResult<>(false, "Already cancelled", null);
        b.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(b);
        return new StandardResult<>(true, "", null);
    }

    private BookingDTO toDTO(Booking b) {
        BookingDTO dto = new BookingDTO();
        dto.setId(b.getId());
        dto.setPlaceId(b.getPlace() != null ? b.getPlace().getId() : 0);
        dto.setBookingRequestId(b.getBookingRequest() != null ? b.getBookingRequest().getId() : 0);
        dto.setStartTime(b.getStartTime());
        dto.setEndTime(b.getEndTime());
        dto.setStatus(b.getStatus());

        dto.setBookingRequest(b.getBookingRequest() != null ? toBookingRequestDTO(b.getBookingRequest()) : null);
        return dto;
    }

    private BookingRequestDTO toBookingRequestDTO(BookingRequest bookingRequest) {
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setId(bookingRequest.getId());
        dto.setUserId(bookingRequest.getUser().getId().intValue());
        dto.setPlaceId(bookingRequest.getPlace() != null ? bookingRequest.getPlace().getId() : 0);
        dto.setReason(bookingRequest.getReason());
        dto.setStatus(bookingRequest.getStatus());
        dto.setRequestedAt(bookingRequest.getRequestedAt());
        dto.setRequestedStartTime(bookingRequest.getRequestedStartTime());
        dto.setRequestedEndTime(bookingRequest.getRequestedEndTime());
        dto.setChangesRequestedReason(bookingRequest.getChangesRequestedReason());
        // attachment file id exposure
        if (bookingRequest.getAttachmentFile() != null) dto.setAttachmentFileId(bookingRequest.getAttachmentFile().getId());
        return dto;
    }

}
