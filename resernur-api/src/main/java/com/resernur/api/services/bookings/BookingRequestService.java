package com.resernur.api.services.bookings;

import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.services.places.PlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BookingRequestService {

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private PlaceService placeService;

    // Create booking request with overlap validation
    @Transactional
    public StandardResult<BookingRequestDTO> createBookingRequest(BookingRequestCreateDTO dto) {
        // Validar datos de entrada
        if (dto.getUserId() == 0 || dto.getPlaceId() == 0 || dto.getRequestedStartTime() == null || dto.getRequestedEndTime() == null) {
            return new StandardResult<>(false, "Missing required fields", null);
        }

        // Validar usuario
        var userOpt = userRepository.findById((long) dto.getUserId());
        if (userOpt.isEmpty()) {
            return new StandardResult<>(false, "User not found", null);
        }

        // Validar lugar
        var placeOpt = placeRepository.findById(dto.getPlaceId());
        if (placeOpt.isEmpty()) {
            return new StandardResult<>(false, "Place not found", null);
        }

        // Validar fechas
        if (dto.getRequestedStartTime().isAfter(dto.getRequestedEndTime())) {
            return new StandardResult<>(false, "Start time must be before end time", null);
        }

        // Validar solapamientos: no debe haber otras requests en ESE periodo para el mismo lugar
        List<BookingRequestStatus> checkStatuses = List.of(
                BookingRequestStatus.ACCEPTED
        );
        var overlaps = bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                dto.getPlaceId(), checkStatuses, dto.getRequestedEndTime(), dto.getRequestedStartTime()
        );
        if (overlaps != null && !overlaps.isEmpty()) {
            return new StandardResult<>(false, "There is already a booking request for this place in the requested time window", null);
        }

        // Crear entidad y guardar
        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setUser(userOpt.get());
        bookingRequest.setPlace(placeOpt.get());
        bookingRequest.setRequestedStartTime(dto.getRequestedStartTime());
        bookingRequest.setRequestedEndTime(dto.getRequestedEndTime());
        bookingRequest.setReason(dto.getReason());

        BookingRequest saved = bookingRequestRepository.save(bookingRequest);

        return new StandardResult<>(true, "", toDTO(saved));
    }

    // Accept a booking request: mark accepted, create Booking (TODO), reject overlapping requests and notify (TODO)
    @Transactional
    public StandardResult<BookingRequestDTO> acceptRequest(int requestId) {
        Optional<BookingRequest> opt = bookingRequestRepository.findById(requestId);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();
        if (req.getStatus() == BookingRequestStatus.ACCEPTED) return new StandardResult<>(false, "Already accepted", null);

        // Mark accepted
        req.setStatus(BookingRequestStatus.ACCEPTED);
        bookingRequestRepository.save(req);

        // TODO: Create Booking entity (BookingRepository/Service not implemented yet)
        // Example (to be implemented): bookingService.createBookingFromRequest(req);

        // Find overlapping requests and mark them as REJECTED, notify users (TODO NotificationService)
        List<BookingRequestStatus> checkStatuses = List.of(BookingRequestStatus.PENDING, BookingRequestStatus.CHANGES_REQUESTED);
        var overlaps = bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                req.getPlace().getId(), checkStatuses, req.getRequestedEndTime(), req.getRequestedStartTime()
        );
        if (overlaps != null) {
            var toReject = overlaps.stream().filter(r -> r.getId() != req.getId()).collect(Collectors.toList());
            for (BookingRequest r : toReject) {
                r.setStatus(BookingRequestStatus.REJECTED);
                r.setChangesRequestedReason("Automatically rejected because another request was accepted for the same time");
                bookingRequestRepository.save(r);
                // TODO: notify user r.getUser() via NotificationService
            }
        }

        return new StandardResult<>(true, "", toDTO(req));
    }

    // Reject a booking request with a reason
    @Transactional
    public StandardResult<BookingRequestDTO> rejectRequest(int requestId, String reason) {
        if (reason == null || reason.isBlank()) return new StandardResult<>(false, "Rejection reason is required", null);
        Optional<BookingRequest> opt = bookingRequestRepository.findById(requestId);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();
        req.setStatus(BookingRequestStatus.REJECTED);
        req.setChangesRequestedReason(reason);
        bookingRequestRepository.save(req);
        // TODO: notify user about rejection via NotificationService
        return new StandardResult<>(true, "", toDTO(req));
    }

    // Request changes for a booking request
    @Transactional
    public StandardResult<BookingRequestDTO> requestChanges(int requestId, String reason) {
        if (reason == null || reason.isBlank()) return new StandardResult<>(false, "Reason is required", null);
        Optional<BookingRequest> opt = bookingRequestRepository.findById(requestId);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();
        req.setStatus(BookingRequestStatus.CHANGES_REQUESTED);
        req.setChangesRequestedReason(reason);
        bookingRequestRepository.save(req);
        // TODO: notify user about requested changes via NotificationService
        return new StandardResult<>(true, "", toDTO(req));
    }

    private BookingRequestDTO toDTO(BookingRequest bookingRequest) {
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
