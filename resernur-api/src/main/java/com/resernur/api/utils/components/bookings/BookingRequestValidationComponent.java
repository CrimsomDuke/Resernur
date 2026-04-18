package com.resernur.api.utils.components.bookings;

import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.pojos.CustomError;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.bookings.BookingRepository;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.utils.date.DateUtils;
import org.springframework.stereotype.Component;

import javax.swing.text.html.Option;
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

    public CustomError validateOverlapping(BookingRequestCreateDTO dto, BookingRequestRepository bookingRequestRepository){
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

}
