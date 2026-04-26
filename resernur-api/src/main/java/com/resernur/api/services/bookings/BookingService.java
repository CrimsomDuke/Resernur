package com.resernur.api.services.bookings;

import com.resernur.api.dtos.bookings.BookingDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.Actions;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.repositories.bookings.BookingRepository;
import com.resernur.api.services.auditlogs.LogService;
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

    @Autowired
    private LogService logService;

    @Transactional
    public StandardResult<BookingDTO> createBookingFromRequest(BookingRequest request) {
        if(request.getStatus() != BookingRequestStatus.ACCEPTED) return new StandardResult<>(false, "BookingRequest must be ACCEPTED to create a Booking", null);
        if (request == null) return new StandardResult<>(false, "BookingRequest is null", null);

        Booking b = new Booking();
        b.setBookingRequest(request);
        b.setPlace(request.getPlace());
        b.setStartTime(request.getRequestedStartTime());
        b.setEndTime(request.getRequestedEndTime());
        b.setActivityType(request.getActivityType());
        b.setStatus(BookingStatus.COMPLETED);

        Booking saved = bookingRepository.save(b);
        logService.logAction(Actions.CREATE, request.getUser().getId().intValue(), "BOOKINGS", saved.getId());
        return new StandardResult<>(true, "", toDTO(saved));
    }

    public StandardResult<BookingDTO> getById(int id) {
        Optional<Booking> opt = bookingRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "Not found", null);
        return new StandardResult<>(true, "", toDTO(opt.get()));
    }

    public PagedResponse<BookingDTO> search(SearchQuery query, BookingStatus status, Integer userId, Boolean ongoing) {
        Pageable pageable = PageRequest.of(
                Math.max(0, query == null ? 0 : query.page),
                Math.max(1, query == null ? 10 : query.pageSize)
        );

        boolean isOngoing = ongoing != null && ongoing;

        Page<Booking> pageResult = bookingRepository.findByDynamicFilters(
                status,
                userId,
                isOngoing,
                LocalDateTime.now(),
                pageable
        );

        var content = pageResult.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return new PagedResponse<>(content, pageResult.getNumber(), pageResult.getSize(),
                pageResult.getTotalElements(), pageResult.getTotalPages(),
                pageResult.isLast(), true, "");
    }

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
        dto.setActivityType(b.getActivityType());

        dto.calculateOngoing(); // dinamicamente determina si está en curso o no
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
