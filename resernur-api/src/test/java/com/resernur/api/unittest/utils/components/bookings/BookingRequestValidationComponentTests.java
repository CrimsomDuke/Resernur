package com.resernur.api.unittest.utils.components.bookings;

import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestUpdateDTO;
import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.utils.components.bookings.BookingRequestValidationComponent;
import com.resernur.api.utils.components.config_parameters.ConfigurationProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingRequestValidationComponentTests {
    @Mock
    BookingRequestRepository bookingRequestRepository;
    @Mock
    ConfigurationProvider configProvider;
    BookingRequestValidationComponent validator;
    User user;
    Place place;
    @BeforeEach
    public void setup() {
        validator = new BookingRequestValidationComponent();
        user = new User();
        user.setId(1L);
        place = new Place();
        place.setId(2);
    }

    @Test
    public void validateUserAndPlaceExistance_success() {
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setPlaceId(place.getId());
        assertDoesNotThrow(() -> validator.validateUserAndPlace(dto, Optional.of(user), Optional.of(place)));
    }

    @Test
    public void validateUserAndPlaceExistance_userNotFound() {
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setPlaceId(place.getId());
        ResernurException ex = assertThrows(ResernurException.class, () ->
                validator.validateUserAndPlace(dto, Optional.empty(), Optional.of(place)));
        assertNotNull(ex);
    }

    @Test
    public void validateUserAndPlaceExistance_placeNotFound() {
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setPlaceId(place.getId());
        ResernurException ex = assertThrows(ResernurException.class, () ->
                validator.validateUserAndPlace(dto, Optional.of(user), Optional.empty()));
        assertNotNull(ex);
    }

    @Test
    public void validateBookingTimes_success() {
        // La reserva debe ser al menos 1 día después de hoy y no exceder 8 horas
        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0);
        LocalDateTime end = start.plusHours(3); // 3 horas de diferencia
        when(configProvider.getInt("MAX_RESERVATION_HOURS")).thenReturn(8);
        when(configProvider.getInt("MIN_ADVANCE_DAYS")).thenReturn(1);
        when(configProvider.getString("OPENING_TIME")).thenReturn("08:00");
        when(configProvider.getString("CLOSING_TIME")).thenReturn("22:00");
        assertDoesNotThrow(() -> validator.validateBookingTimes(LocalDateTime.now(), start, end, configProvider));
    }

    @Test
    public void validateBookingTimes_startAfterEnd() {
        LocalDateTime now = LocalDateTime.now().plusDays(2);
        ResernurException ex = assertThrows(ResernurException.class, () ->
                validator.validateBookingTimes(LocalDateTime.now(), now.plusHours(2), now, configProvider));
        assertNotNull(ex);
    }

    @Test
    public void validateBookingTimes_startInPast() {
        LocalDateTime now = LocalDateTime.now().minusDays(1);
        ResernurException ex = assertThrows(ResernurException.class, () ->
                validator.validateBookingTimes(LocalDateTime.now(), now, now.plusHours(2), configProvider));
        assertNotNull(ex);
    }

    @Test
    public void validateOverlappingOnCreate_success() {
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setPlaceId(2);
        dto.setRequestedStartTime(LocalDateTime.now().plusDays(2));
        dto.setRequestedEndTime(LocalDateTime.now().plusDays(2).plusHours(2));
        when(bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                anyInt(), anyList(), any(), any()
        )).thenReturn(List.of());
        assertDoesNotThrow(() -> validator.validateOverlappingOnCreate(dto, bookingRequestRepository));
    }

    @Test
    public void validateOverlappingOnCreate_conflict() {
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setPlaceId(2);
        dto.setRequestedStartTime(LocalDateTime.now().plusDays(2));
        dto.setRequestedEndTime(LocalDateTime.now().plusDays(2).plusHours(2));
        when(bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                anyInt(), anyList(), any(), any()
        )).thenReturn(List.of(new BookingRequest()));
        ResernurException ex = assertThrows(ResernurException.class, () ->
                validator.validateOverlappingOnCreate(dto, bookingRequestRepository));
        assertNotNull(ex);
    }

    @Test
    public void validateUpdateRequestFields_success() {
        BookingRequestUpdateDTO dto = new BookingRequestUpdateDTO();
        dto.setUserId(1);
        BookingRequest req = new BookingRequest();
        req.setStatus(BookingRequestStatus.CHANGES_REQUESTED);
        User u = new User();
        u.setId(1L);
        req.setUser(u);
        assertDoesNotThrow(() -> validator.validateUpdateRequestFields(dto, req));
    }

    @Test
    public void validateUpdateRequestFields_notChangesRequested() {
        BookingRequestUpdateDTO dto = new BookingRequestUpdateDTO();
        dto.setUserId(1);
        BookingRequest req = new BookingRequest();
        req.setStatus(BookingRequestStatus.ACCEPTED);
        User u = new User();
        u.setId(1L);
        req.setUser(u);
        ResernurException ex = assertThrows(ResernurException.class, () ->
                validator.validateUpdateRequestFields(dto, req));
        assertNotNull(ex);
    }

    @Test
    public void validateUpdateRequestFields_notOwner() {
        BookingRequestUpdateDTO dto = new BookingRequestUpdateDTO();
        dto.setUserId(2);
        BookingRequest req = new BookingRequest();
        req.setStatus(BookingRequestStatus.CHANGES_REQUESTED);
        User u = new User();
        u.setId(1L);
        req.setUser(u);
        ResernurException ex = assertThrows(ResernurException.class, () ->
                validator.validateUpdateRequestFields(dto, req));
        assertNotNull(ex);
    }

    @Test
    public void validateOverlappingOnUpdate_success() {
        BookingRequestUpdateDTO dto = new BookingRequestUpdateDTO();
        dto.setUserId(1);
        dto.setRequestedStartTime(LocalDateTime.now().plusDays(2));
        dto.setRequestedEndTime(LocalDateTime.now().plusDays(2).plusHours(2));
        BookingRequest req = new BookingRequest();
        req.setId(1);
        req.setPlace(place);
        when(bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                anyInt(), anyList(), any(), any()
        )).thenReturn(List.of());
        assertDoesNotThrow(() -> validator.validateOverlappingOnUpdate(dto, req, bookingRequestRepository));
    }

    @Test
    public void validateOverlappingOnUpdate_conflict() {
        BookingRequestUpdateDTO dto = new BookingRequestUpdateDTO();
        dto.setUserId(1);
        dto.setRequestedStartTime(LocalDateTime.now().plusDays(2));
        dto.setRequestedEndTime(LocalDateTime.now().plusDays(2).plusHours(2));
        BookingRequest req = new BookingRequest();
        req.setId(1);
        req.setPlace(place);
        BookingRequest other = new BookingRequest();
        other.setId(2);
        when(bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                anyInt(), anyList(), any(), any()
        )).thenReturn(List.of(other));
        ResernurException ex = assertThrows(ResernurException.class, () ->
                validator.validateOverlappingOnUpdate(dto, req, bookingRequestRepository));
    }
}
