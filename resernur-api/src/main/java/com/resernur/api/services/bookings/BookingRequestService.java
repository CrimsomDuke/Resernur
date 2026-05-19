package com.resernur.api.services.bookings;

import com.resernur.api.dtos.bookings.BookingDTO;
import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.bookings.BookingRequestUpdateDTO;
import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.dtos.pojos.CustomError;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.dtos.users.UserDTO;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.Actions;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.files.File;
import com.resernur.api.models.places.Place;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.services.NotificationService;
import com.resernur.api.services.auditlogs.LogService;
import com.resernur.api.services.files.FileService;
import com.resernur.api.services.places.PlaceService;
import com.resernur.api.utils.components.bookings.BookingRequestValidationComponent;
import com.resernur.api.utils.components.config_parameters.ConfigurationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
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
    private FileService fileService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private LogService logService;

    @Autowired
    private ConfigurationProvider configurationProvider;

    @Autowired
    private BookingRequestValidationComponent validationComponent;


    // Create booking request with overlap validation
    @Transactional
    public StandardResult<BookingRequestDTO> createBookingRequest(BookingRequestCreateDTO dto, int userId) throws ResernurException, IOException {
        // Validar datos de entrada
        if (dto.containsMissingFields()) {
            throw new ResernurException("Faltan campos requeridos ");
        }

        // Validar usuario
        var userOpt = userRepository.findById((long) dto.getUserId());
        var placeOpt = placeRepository.findById(dto.getPlaceId());
        validationComponent.validateUserAndPlace(dto, userOpt, placeOpt);
        // Validar fechas
        validationComponent.validateBookingTimes(LocalDateTime.now(), dto.getRequestedStartTime(), dto.getRequestedEndTime(), configurationProvider);
        // Validar solapamientos: no debe haber otras requests en ESE periodo para el mismo lugar
        validationComponent.validateOverlappingOnCreate(dto, bookingRequestRepository);
        // Crear entidad y guardar
        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setUser(userOpt.get());
        bookingRequest.setPlace(placeOpt.get());
        bookingRequest.setRequestedStartTime(dto.getRequestedStartTime());
        bookingRequest.setRequestedEndTime(dto.getRequestedEndTime());
        bookingRequest.setActivityType(dto.getActivityType());
        bookingRequest.setReason(dto.getReason());

        //handle file oh yeah
        if(dto.getAttachmentFile() != null){
            StandardResult<File> fileResult;
            fileResult = fileService.saveFile(dto.getAttachmentFile());

            if (!fileResult.isSuccess()) {
                return new StandardResult<>(false, "Failed to save attachment file: " + fileResult.getErrorMessage(), null);
            }

            bookingRequest.setAttachmentFile(fileResult.getData());
        }

        BookingRequest saved = bookingRequestRepository.save(bookingRequest);
        notificationService.createNotification((long) dto.getUserId(), "Tu solicitud de reserva fue enviada y esta pendiente de revision");
        notificationService.createNotificationForUsersInRole(UserRole.ADMINISTRADOR, "Se creo una nueva reserva");

        logService.logAction(Actions.CREATE, userId, "BOOKING_REQUEST", saved.getId());

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
    public StandardResult<BookingRequestDTO> updateByRequester(int id, BookingRequestUpdateDTO dto, int userId) throws ResernurException {
        Optional<BookingRequest> opt = bookingRequestRepository.findById(id);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();

        validationComponent.validateUpdateRequestFields(dto, req);

        // Validate dates if provided
        if (dto.getRequestedStartTime() != null && dto.getRequestedEndTime() != null) {
            validationComponent.validateBookingTimes(LocalDateTime.now(), dto.getRequestedStartTime(), dto.getRequestedEndTime(), configurationProvider);

            validationComponent.validateOverlappingOnUpdate(dto, req, bookingRequestRepository);
            req.setRequestedStartTime(dto.getRequestedStartTime());
            req.setRequestedEndTime(dto.getRequestedEndTime());
        }

        if (dto.getReason() != null) req.setReason(dto.getReason());
        // After update, set status back to PENDING
        req.setStatus(BookingRequestStatus.PENDING);
        BookingRequest saved = bookingRequestRepository.save(req);


        logService.logAction(Actions.UPDATE, userId, "BOOKING_REQUEST", saved.getId());

        return new StandardResult<>(true, "", toDTO(saved));
    }

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

    @Transactional
    public StandardResult<Void> delete(int id, int requesterId) {
        return deleteRequest(id, requesterId);
    }

    @Transactional
    public StandardResult<BookingRequestDTO> acceptRequest(int requestId, int userId) {
        Optional<BookingRequest> opt = bookingRequestRepository.findById(requestId);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();
        if (req.getStatus() == BookingRequestStatus.ACCEPTED) return new StandardResult<>(false, "Already accepted", null);

        validationComponent.validateUserIsInChargeOrAdmin(userId, req.getPlace(), userRepository);

        // Mark place as RESERVED when a request is accepted
        Place place = req.getPlace();
        place.setStatus(PlaceStatus.RESERVED);
        placeRepository.save(place);
        // Mark accepted
        req.setStatus(BookingRequestStatus.ACCEPTED);
        bookingRequestRepository.save(req);

        List<BookingRequestStatus> checkStatuses = List.of(BookingRequestStatus.PENDING, BookingRequestStatus.CHANGES_REQUESTED);
        var overlaps = bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                req.getPlace().getId(), checkStatuses, req.getRequestedEndTime(), req.getRequestedStartTime()
        );
        if (overlaps != null) {
            var toReject = overlaps.stream().filter(r -> r.getId() != req.getId()).collect(Collectors.toList());
            for (BookingRequest r : toReject) {
                r.setStatus(BookingRequestStatus.REJECTED);
                r.setChangesRequestedReason("Se rechazaron automaticamente debido a que se aceptó una solicitud en horario cercano");
                bookingRequestRepository.save(r);
                notificationService.createNotification(req.getUser().getId(), "Se rechazaron automaticamente debido a que se aceptó una solicitud en horario cercano");
            }
        }

        //Crear el booking
        StandardResult<BookingDTO> resBooking = bookingService.createBookingFromRequest(req);
        if(resBooking.isSuccess() == false) return new StandardResult<>(false, "Failed to create booking from accepted request: " + resBooking.getErrorMessage(), toDTO(req));

        notificationService.createNotification(req.getUser().getId(), "Se aceptó tu solicitud.");

        logService.logAction(Actions.APPROVE, userId, "BOOKING_REQUEST", resBooking.getData().getBookingRequestId());

        return new StandardResult<>(true, "", toDTO(req));
    }

    @Transactional
    public StandardResult<BookingRequestDTO> rejectRequest(int requestId, String reason, int userId) {
        if (reason == null || reason.isBlank()) return new StandardResult<>(false, "Se necesita razon de rechazo", null);
        Optional<BookingRequest> opt = bookingRequestRepository.findById(requestId);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();

        validationComponent.validateUserIsInChargeOrAdmin(userId, req.getPlace(), userRepository);

        req.setStatus(BookingRequestStatus.REJECTED);
        req.setChangesRequestedReason(reason);

        bookingRequestRepository.save(req);
        notificationService.createNotification(req.getUser().getId(), "Se rechazo tu solicitud. Reason: " + reason);


        logService.logAction(Actions.REJECT, userId, "BOOKING_REQUEST", req.getId());

        return new StandardResult<>(true, "", toDTO(req));
    }

    @Transactional
    public StandardResult<BookingRequestDTO> requestChanges(int requestId, String reason, int userId) {
        if (reason == null || reason.isBlank()) return new StandardResult<>(false, "Se requiere una razon", null);
        Optional<BookingRequest> opt = bookingRequestRepository.findById(requestId);
        if (opt.isEmpty()) return new StandardResult<>(false, "Booking request not found", null);
        BookingRequest req = opt.get();

        validationComponent.validateUserIsInChargeOrAdmin(userId, req.getPlace(), userRepository);

        req.setStatus(BookingRequestStatus.CHANGES_REQUESTED);
        req.setChangesRequestedReason(reason);
        bookingRequestRepository.save(req);
        notificationService.createNotification(req.getUser().getId(), "Se solicitaron cambios. Reason: " + reason);
        logService.logAction(Actions.REJECT, userId, "BOOKING_REQUEST", req.getId());

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
        dto.setActivityType(bookingRequest.getActivityType());
        // attachment file id exposure
        if (bookingRequest.getAttachmentFile() != null) dto.setAttachmentFileId(bookingRequest.getAttachmentFile().getId());
        return dto;
    }

}
