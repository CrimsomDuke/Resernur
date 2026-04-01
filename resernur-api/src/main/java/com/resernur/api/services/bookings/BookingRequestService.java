package com.resernur.api.services.bookings;

import com.resernur.api.dtos.bookings.BookingDTO;
import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.bookings.BookingRequestUpdateDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.files.File;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.services.files.FileService;
import com.resernur.api.services.places.PlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private PlaceService placeService;

    @Autowired
    private FileService fileService;

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

        //handle file oh yeah
        if(dto.getAttachmentFile() != null){
            StandardResult<File> fileResult;
            try{
                fileResult = fileService.saveFile(dto.getAttachmentFile());
            }catch (Exception ex){
                return new StandardResult<>(false, "Failed to save attachment file: " + ex.getMessage(), null);
            }

            if (!fileResult.isSuccess()) {
                return new StandardResult<>(false, "Failed to save attachment file: " + fileResult.getErrorMessage(), null);
            }

            bookingRequest.setAttachmentFile(fileResult.getData());
        }

        BookingRequest saved = bookingRequestRepository.save(bookingRequest);

        return new StandardResult<>(true, "", toDTO(saved));
    }

    // Get by id
    public StandardResult<BookingRequestDTO> getById(int id) {
        Optional<BookingRequest> opt = bookingRequestRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "Not found", null);
        return new StandardResult<>(true, "", toDTO(opt.get()));
    }

    // Get paged by user
    public PagedResponse<BookingRequestDTO> getByUserPaged(int userId, SearchQuery query) {
        int page = Math.max(0, query == null ? 0 : query.page);
        int pageSize = Math.max(1, query == null ? 10 : query.pageSize);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<BookingRequest> pageResult = bookingRequestRepository.findAllByUserId(userId, pageable);
        var content = pageResult.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PagedResponse<>(content, pageResult.getNumber(), pageResult.getSize(), pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.isLast(), true, "");
    }

    // Get all paged, optional filter by status
    public PagedResponse<BookingRequestDTO> getAllPaged(SearchQuery query, BookingRequestStatus status) {
        int page = Math.max(0, query == null ? 0 : query.page);
        int pageSize = Math.max(1, query == null ? 10 : query.pageSize);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<BookingRequest> pageResult;
        if (status == null) {
            pageResult = bookingRequestRepository.findAll(pageable);
        } else {
            pageResult = bookingRequestRepository.findByStatus(status, pageable);
        }
        var content = pageResult.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PagedResponse<>(content, pageResult.getNumber(), pageResult.getSize(), pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.isLast(), true, "");
    }

    // Update by requester: can change time interval and reason
    @Transactional
    public StandardResult<BookingRequestDTO> updateByRequester(int id, BookingRequestUpdateDTO dto) {
        Optional<BookingRequest> opt = bookingRequestRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();

        //Only can update on changesReqeestedd
        if(req.getStatus() != BookingRequestStatus.CHANGES_REQUESTED){
            return new StandardResult<>(false, "Only requests with status 'CHANGES_REQUESTED' can be updated by the requester", null);
        }

        // Check ownership
        if (req.getUser() == null || req.getUser().getId().intValue() != dto.getUserId()) {
            return new StandardResult<>(false, "Unauthorized: only the requester can update this booking request", null);
        }
        // Only allow updates when not accepted
        if (req.getStatus() == BookingRequestStatus.ACCEPTED) {
            return new StandardResult<>(false, "Cannot modify an accepted request", null);
        }
        // Validate dates if provided
        if (dto.getRequestedStartTime() != null && dto.getRequestedEndTime() != null) {
            if (dto.getRequestedStartTime().isAfter(dto.getRequestedEndTime())) {
                return new StandardResult<>(false, "Start time must be before end time", null);
            }
            // Check overlaps with accepted bookings
            List<BookingRequestStatus> checkStatuses = List.of(BookingRequestStatus.ACCEPTED);
            var overlaps = bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                    req.getPlace().getId(), checkStatuses, dto.getRequestedEndTime(), dto.getRequestedStartTime()
            );
            // exclude self
            boolean conflict = overlaps.stream().anyMatch(r -> r.getId() != req.getId());
            if (conflict) {
                return new StandardResult<>(false, "Requested time conflicts with an existing accepted booking", null);
            }
            req.setRequestedStartTime(dto.getRequestedStartTime());
            req.setRequestedEndTime(dto.getRequestedEndTime());
        }
        if (dto.getReason() != null) req.setReason(dto.getReason());
        // After update, set status back to PENDING
        req.setStatus(BookingRequestStatus.PENDING);
        BookingRequest saved = bookingRequestRepository.save(req);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    // Delete request (owner can delete)
    @Transactional
    public StandardResult<Void> deleteRequest(int id, int requesterId) {
        Optional<BookingRequest> opt = bookingRequestRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();
        if (req.getUser() == null || req.getUser().getId().intValue() != requesterId) {
            return new StandardResult<>(false, "Unauthorized: only the requester can delete this booking request", null);
        }
        bookingRequestRepository.deleteById(id);
        return new StandardResult<>(true, "", null);
    }

    // Backward-compatible alias: controller calls `delete(id, requesterId)`
    @Transactional
    public StandardResult<Void> delete(int id, int requesterId) {
        return deleteRequest(id, requesterId);
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


        //Crear el booking
        StandardResult<BookingDTO> resBooking = bookingService.createBookingFromRequest(req);
        if(resBooking.isSuccess() == false) return new StandardResult<>(false, "Failed to create booking from accepted request: " + resBooking.getErrorMessage(), toDTO(req));


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
