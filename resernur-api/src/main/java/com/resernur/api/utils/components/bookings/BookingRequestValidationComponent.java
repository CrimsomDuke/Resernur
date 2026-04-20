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
import com.resernur.api.utils.components.config_parameters.ConfigurationProvider;
import com.resernur.api.utils.date.CustomDateObject;
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

    public CustomError validateBookingTimes(LocalDateTime requestCreatedTime,
                                            LocalDateTime requestedStartTime,
                                            LocalDateTime requestedEndTime,
                                            ConfigurationProvider configProvider) {

        //VALIDACIONES SIMPLONAS
        if (requestedStartTime == null || requestedEndTime == null) {
            return new CustomError("Las fechas de inicio y fin son obligatorias");
        }

        if (requestedStartTime.isAfter(requestedEndTime)) {
            return new CustomError("La fecha de inicio no puede ser posterior a la fecha de fin");
        }

        if (requestedStartTime.isBefore(LocalDateTime.now())) {
            return new CustomError("La fecha de inicio no puede ser en el pasado");
        }

        //VALIDACIONES COMPLEJAS

        int MAX_RESERVATION_HOURS = configProvider.getInt("MAX_RESERVATION_HOURS");
        int MIN_ADVANCED_DAYS = configProvider.getInt("MIN_ADVANCE_DAYS");
        String OPENING_TIME = configProvider.getString("OPENING_TIME");
        String CLOSING_TIME = configProvider.getString("CLOSING_TIME");

        CustomDateObject startTimeCustom = dateUtils.getDateFromLocalDateTime(requestedStartTime);
        CustomDateObject endTimeCustom = dateUtils.getDateFromLocalDateTime(requestedEndTime);

        // horas maximas
        long hoursBetween = dateUtils.hoursBetweenDates(requestedStartTime, requestedEndTime);
        if(hoursBetween > MAX_RESERVATION_HOURS){
            return new CustomError("La duración máxima de una reserva es de " + MAX_RESERVATION_HOURS + " horas");
        }

        //Dias de previsión
        long daysBetween = dateUtils.daysBetweenDates(requestCreatedTime, requestedStartTime);
        if(daysBetween < MIN_ADVANCED_DAYS){
            return new CustomError("Las reservas deben hacerse con al menos " + MIN_ADVANCED_DAYS + " días de anticipación");
        }

        //Reserva se encuentra en horarios disponibles
        if(!dateUtils.DatesSpanInBetweenHours(startTimeCustom, endTimeCustom, OPENING_TIME, CLOSING_TIME)){
            return new CustomError("Las reservas deben estar dentro del horario de atención: " + OPENING_TIME + " a " + CLOSING_TIME);
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
