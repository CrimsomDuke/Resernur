package com.resernur.api.integrationtests.place;

import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.bookings.BookingRepository;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.places.PlaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PlaceIntegrationTests {

    @Autowired
    private PlaceService placeService;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    private User admin;
    private User requester;
    private Place place;

    @BeforeEach
    public void setup() {
        bookingRepository.deleteAll();
        bookingRequestRepository.deleteAll();
        placeRepository.deleteAll();
        userRepository.deleteAll();

        admin = new User();
        admin.setEmail("admin@test.com");
        admin.setPassword("pass");
        admin.setFullName("Admin");
        admin.setRole(UserRole.ADMINISTRADOR);
        admin = userRepository.save(admin);

        requester = new User();
        requester.setEmail("user@test.com");
        requester.setPassword("pass");
        requester.setFullName("User");
        requester.setRole(UserRole.SOLICITANTE);
        requester = userRepository.save(requester);

        place = new Place();
        place.setName("Sala A");
        place.setDescription("Sala de pruebas");
        place.setCapacity(10);
        place.setUserInCharge(admin);
        place.setStatus(PlaceStatus.AVAILABLE);
        place = placeRepository.save(place);
    }

    @Test
    public void changePlaceStatus_toUnderMaintenance_cancelsBookingsAndRejectsPendingRequests() {
        LocalDateTime now = LocalDateTime.now();

        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setUser(requester);
        bookingRequest.setPlace(place);
        bookingRequest.setRequestedStartTime(now.plusDays(1));
        bookingRequest.setRequestedEndTime(now.plusDays(1).plusHours(2));
        bookingRequest.setStatus(BookingRequestStatus.PENDING);
        BookingRequest savedRequest = bookingRequestRepository.save(bookingRequest);

        Booking booking = new Booking();
        booking.setBookingRequest(savedRequest);
        booking.setPlace(place);
        booking.setStartTime(now.plusDays(1));
        booking.setEndTime(now.plusDays(2));
        booking.setStatus(BookingStatus.COMPLETED);
        Booking savedBooking = bookingRepository.save(booking);

        BookingRequest pendingReq = new BookingRequest();
        pendingReq.setUser(requester);
        pendingReq.setPlace(place);
        pendingReq.setRequestedStartTime(now.plusDays(3));
        pendingReq.setRequestedEndTime(now.plusDays(3).plusHours(2));
        pendingReq.setStatus(BookingRequestStatus.PENDING);
        BookingRequest savedPending = bookingRequestRepository.save(pendingReq);

        StandardResult<?> res = placeService.changePlaceStatus(place.getId(), PlaceStatus.UNDER_MAINTENANCE);

        assertNotNull(res);
        assertTrue(res.isSuccess());
        assertEquals(PlaceStatus.UNDER_MAINTENANCE, ((com.resernur.api.dtos.places.PlaceDTO)res.getData()).getStatus());

        var bookingAfter = bookingRepository.findById(savedBooking.getId());
        assertTrue(bookingAfter.isPresent());
        assertEquals(BookingStatus.CANCELLED, bookingAfter.get().getStatus());

        var pendingAfter = bookingRequestRepository.findById(savedPending.getId());
        assertTrue(pendingAfter.isPresent());
        assertEquals(BookingRequestStatus.REJECTED, pendingAfter.get().getStatus());
        assertNotNull(pendingAfter.get().getChangesRequestedReason());
        assertTrue(pendingAfter.get().getChangesRequestedReason().toLowerCase().contains("mantenimiento"));
    }

}

