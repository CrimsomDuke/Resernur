package com.resernur.api.utils.components.bookings;

import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestUpdateDTO;
import com.resernur.api.dtos.pojos.CustomError;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.utils.date.DateUtils;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
public class BookingRequestValidationComponent {
    private final DateUtils dateUtils = new DateUtils();

    public CustomError validateUserAndPlaceExistance(Optional<User> userOpt, Optional<Place> placeOpt) {
        if (userOpt.isEmpty()) {
            return new CustomError("Usuario no encontrado");
        }

        // Validar lugar
        if (placeOpt.isEmpty()) {
            return new CustomError("Lugar no encontrado");
        }

        return null;
    }

    public CustomError validateBookingTimes(LocalDateTime requestedStartTime, LocalDateTime requestedEndTime) {
        if (requestedStartTime == null || requestedEndTime == null) {
            return new CustomError("Las fechas de inicio y fin son obligatorias");
        }

        if (requestedStartTime.isAfter(requestedEndTime)) {
            return new CustomError("La fecha de inicio no puede ser posterior a la fecha de fin");
        }

        if (requestedStartTime.isBefore(LocalDateTime.now())) {
            return new CustomError("La fecha de inicio no puede ser en el pasado");
        }

        return null;
    }

    public CustomError validateOverlappingOnCreate(BookingRequestCreateDTO dto, BookingRequestRepository bookingRequestRepository){
        List<BookingRequestStatus> checkStatuses = List.of(
                BookingRequestStatus.ACCEPTED
        );
        var overlaps = bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                dto.getPlaceId(), checkStatuses, dto.getRequestedEndTime(), dto.getRequestedStartTime()
        );
        if (overlaps != null && !overlaps.isEmpty()) {
            return new CustomError("Ya hay reservas en esta ventana de tiempo para este lugar");
        }

        return null;
    }

    public CustomError validateUpdateRequestFields(BookingRequestUpdateDTO dto, BookingRequest req){
        //Only can update on changesReqeestedd
        if(req.getStatus() != BookingRequestStatus.CHANGES_REQUESTED){
            return new CustomError("Solo solicitudes con status 'CHANGES_REQUESTED' pueden ser modificadas");
        }

        // Check ownership
        if (req.getUser() == null || req.getUser().getId().intValue() != dto.getUserId()) {
            return new CustomError("No autorizado, solo quien solicitó puede hacer cambios");
        }
        // Only allow updates when not accepted
        if (req.getStatus() == BookingRequestStatus.ACCEPTED) {
            return new CustomError("No se puede modificar una solicitud aceptada");
        }

        return null;
    }

    public CustomError validateOverlappingOnUpdate(BookingRequestUpdateDTO dto, BookingRequest req, BookingRequestRepository bookingRequestRepository){
        List<BookingRequestStatus> checkStatuses = List.of(BookingRequestStatus.ACCEPTED);
        var overlaps = bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                req.getPlace().getId(), checkStatuses, dto.getRequestedEndTime(), dto.getRequestedStartTime()
        );
        // exclude self
        boolean conflict = overlaps.stream().anyMatch(r -> r.getId() != req.getId());
        if (conflict) {
            return new CustomError("El tiempo solicitda conlfictua con otras reservas ya aceptadas");
        }

        return null;
    }

}
