package com.resernur.api.integrationtests.booking;

import com.resernur.api.dtos.auth.RegisterDTO;
import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.bookings.BookingRequestUpdateDTO;
import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.enums.ActivityType;
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
import com.resernur.api.services.bookings.BookingRequestService;
import com.resernur.api.services.security.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class BookingIntegrationTests {

    @Autowired
    private BookingRequestService bookingRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AuthService authService;

    private User user;
    private User adminUser;
    private Place place;

    @BeforeEach
    public void setup(){
        bookingRepository.deleteAll();
        bookingRequestRepository.deleteAll();
        placeRepository.deleteAll();
        userRepository.deleteAll();

        // Create regular user (requester)
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setEmail("user@gmail.com");
        registerDTO.setPassword("user123");
        registerDTO.setFullName("User User");
        registerDTO.setRole(UserRole.SOLICITANTE);
        authService.register(registerDTO);
        var userOpt = userRepository.findByEmail(registerDTO.getEmail());
        assertTrue(userOpt.isPresent(), "Regular user should be created");
        user = userOpt.get();

        // Create admin user (reviewer)
        RegisterDTO adminDTO = new RegisterDTO();
        adminDTO.setEmail("admin@gmail.com");
        adminDTO.setPassword("admin123");
        adminDTO.setFullName("Admin Admin");
        adminDTO.setRole(UserRole.ADMINISTRADOR);
        authService.register(adminDTO);
        var adminOpt = userRepository.findByEmail(adminDTO.getEmail());
        assertTrue(adminOpt.isPresent(), "Admin user should be created");
        adminUser = adminOpt.get();

        // Create a place
        place = new Place();
        place.setName("Aula Magna");
        place.setDescription("Gran salón para eventos");
        place.setCapacity(100);
        place.setUserInCharge(adminUser);
        place.setStatus(PlaceStatus.AVAILABLE);
        place = placeRepository.save(place);
    }

    @Test
    public void createBookingRequestAndAccept() throws ResernurException, IOException {
        LocalDateTime startTime = LocalDateTime.now().plusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endTime = startTime.plusHours(2);

        BookingRequestCreateDTO requestDTO = new BookingRequestCreateDTO();
        requestDTO.setUserId(user.getId().intValue());
        requestDTO.setPlaceId(place.getId());
        requestDTO.setReason("Clase de programación");
        requestDTO.setActivityType(ActivityType.ACADEMICO);
        requestDTO.setRequestedStartTime(startTime);
        requestDTO.setRequestedEndTime(endTime);
        requestDTO.setAttachmentFile(null);

        StandardResult<BookingRequestDTO> createResult = bookingRequestService.createBookingRequest(requestDTO, user.getId().intValue());

        assertNotNull(createResult);
        assertTrue(createResult.isSuccess());
        assertNotNull(createResult.getData());
        int bookingRequestId = createResult.getData().getId();
        assertEquals(user.getId().intValue(), createResult.getData().getUserId());
        assertEquals(place.getId(), createResult.getData().getPlaceId());
        assertEquals(BookingRequestStatus.PENDING, createResult.getData().getStatus());

        StandardResult<BookingRequestDTO> acceptResult = bookingRequestService.acceptRequest(bookingRequestId, adminUser.getId().intValue());

        assertNotNull(acceptResult);
        assertTrue(acceptResult.isSuccess());
        assertNotNull(acceptResult.getData());
        assertEquals(BookingRequestStatus.ACCEPTED, acceptResult.getData().getStatus());
        assertEquals(bookingRequestId, acceptResult.getData().getId());

        var placeAfterAccept = placeRepository.findById(place.getId());
        assertTrue(placeAfterAccept.isPresent(), "Place should still exist");
        assertEquals(PlaceStatus.RESERVED, placeAfterAccept.get().getStatus());

        var bookingRequests = bookingRequestRepository.findAll();
        assertEquals(1, bookingRequests.size());
        assertEquals(BookingRequestStatus.ACCEPTED, bookingRequests.getFirst().getStatus());

        var bookings = bookingRepository.findAll();
        assertEquals(1, bookings.size());
        Booking booking = bookings.getFirst();
        assertEquals(bookingRequestId, booking.getBookingRequest().getId());
        assertEquals(place.getId(), booking.getPlace().getId());
        assertEquals(BookingStatus.COMPLETED, booking.getStatus());
        assertEquals(startTime, booking.getStartTime());
        assertEquals(endTime, booking.getEndTime());
    }

    @Test
    public void createBookingRequestAndReject() throws ResernurException, IOException {
        LocalDateTime startTime = LocalDateTime.now().plusDays(4).withHour(11).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endTime = startTime.plusHours(2);

        BookingRequestCreateDTO requestDTO = new BookingRequestCreateDTO();
        requestDTO.setUserId(user.getId().intValue());
        requestDTO.setPlaceId(place.getId());
        requestDTO.setReason("Reunión estudiantil");
        requestDTO.setActivityType(ActivityType.ACADEMICO);
        requestDTO.setRequestedStartTime(startTime);
        requestDTO.setRequestedEndTime(endTime);
        requestDTO.setAttachmentFile(null);

        StandardResult<BookingRequestDTO> createResult = bookingRequestService.createBookingRequest(requestDTO, user.getId().intValue());

        assertNotNull(createResult);
        assertTrue(createResult.isSuccess());
        int bookingRequestId = createResult.getData().getId();
        assertEquals(BookingRequestStatus.PENDING, createResult.getData().getStatus());

        String rejectReason = "No hay disponibilidad";
        StandardResult<BookingRequestDTO> rejectResult = bookingRequestService.rejectRequest(bookingRequestId, rejectReason, adminUser.getId().intValue());

        assertNotNull(rejectResult);
        assertTrue(rejectResult.isSuccess());
        assertNotNull(rejectResult.getData());
        assertEquals(bookingRequestId, rejectResult.getData().getId());
        assertEquals(BookingRequestStatus.REJECTED, rejectResult.getData().getStatus());
        assertEquals(rejectReason, rejectResult.getData().getChangesRequestedReason());

        var requestAfterReject = bookingRequestRepository.findById(bookingRequestId);
        assertTrue(requestAfterReject.isPresent(), "Booking request should remain in DB");
        assertEquals(BookingRequestStatus.REJECTED, requestAfterReject.get().getStatus());
        assertEquals(rejectReason, requestAfterReject.get().getChangesRequestedReason());

        var placeAfterReject = placeRepository.findById(place.getId());
        assertTrue(placeAfterReject.isPresent(), "Place should still exist");
        assertEquals(PlaceStatus.AVAILABLE, placeAfterReject.get().getStatus());

        assertTrue(bookingRepository.findAll().isEmpty(), "Rejecting should not create a booking");
    }

    @Test
    public void createBookingRequestAndRequestChangesThenUserUpdatesRequestAndAccept() throws ResernurException, IOException {
        LocalDateTime originalStart = LocalDateTime.now().plusDays(5).withHour(9).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime originalEnd = originalStart.plusHours(2);


        //CREA EL FUCKING REQUEST
        BookingRequestCreateDTO requestDTO = new BookingRequestCreateDTO();
        requestDTO.setUserId(user.getId().intValue());
        requestDTO.setPlaceId(place.getId());
        requestDTO.setReason("Taller inicial");
        requestDTO.setActivityType(ActivityType.ACADEMICO);
        requestDTO.setRequestedStartTime(originalStart);
        requestDTO.setRequestedEndTime(originalEnd);
        requestDTO.setAttachmentFile(null);

        StandardResult<BookingRequestDTO> createResult = bookingRequestService.createBookingRequest(requestDTO, user.getId().intValue());
        assertNotNull(createResult);
        assertTrue(createResult.isSuccess());
        int bookingRequestId = createResult.getData().getId();


        //el amdin puide cambios
        String changeReason = "Necesitamos ajustar el horario";
        StandardResult<BookingRequestDTO> changeResult = bookingRequestService.requestChanges(bookingRequestId, changeReason, adminUser.getId().intValue());
        assertNotNull(changeResult);
        assertTrue(changeResult.isSuccess());
        assertEquals(BookingRequestStatus.CHANGES_REQUESTED, changeResult.getData().getStatus());
        assertEquals(changeReason, changeResult.getData().getChangesRequestedReason());

        var requestAfterChange = bookingRequestRepository.findById(bookingRequestId);
        assertTrue(requestAfterChange.isPresent(), "Booking request should remain in DB");
        assertEquals(BookingRequestStatus.CHANGES_REQUESTED, requestAfterChange.get().getStatus());
        assertEquals(changeReason, requestAfterChange.get().getChangesRequestedReason());

        BookingRequestUpdateDTO updateDTO = new BookingRequestUpdateDTO();
        updateDTO.setReason("Taller actualizado");
        LocalDateTime updatedStart = originalStart.plusDays(1);
        LocalDateTime updatedEnd = updatedStart.plusHours(3);
        updateDTO.setRequestedStartTime(updatedStart);
        updateDTO.setRequestedEndTime(updatedEnd);
        updateDTO.setUserId(user.getId().intValue());

        // el usuario actualiza
        StandardResult<BookingRequestDTO> updateResult = bookingRequestService.updateByRequester(bookingRequestId, updateDTO, user.getId().intValue());
        assertNotNull(updateResult);
        assertTrue(updateResult.isSuccess());
        assertEquals(BookingRequestStatus.PENDING, updateResult.getData().getStatus());
        assertEquals("Taller actualizado", updateResult.getData().getReason());
        assertEquals(updatedStart, updateResult.getData().getRequestedStartTime());
        assertEquals(updatedEnd, updateResult.getData().getRequestedEndTime());

        var requestAfterUpdate = bookingRequestRepository.findById(bookingRequestId);
        assertTrue(requestAfterUpdate.isPresent(), "Booking request should remain in DB");
        assertEquals(BookingRequestStatus.PENDING, requestAfterUpdate.get().getStatus());
        assertEquals("Taller actualizado", requestAfterUpdate.get().getReason());
        assertEquals(updatedStart, requestAfterUpdate.get().getRequestedStartTime());
        assertEquals(updatedEnd, requestAfterUpdate.get().getRequestedEndTime());

        StandardResult<BookingRequestDTO> acceptResult = bookingRequestService.acceptRequest(bookingRequestId, adminUser.getId().intValue());
        assertNotNull(acceptResult);
        assertTrue(acceptResult.isSuccess());
        assertEquals(BookingRequestStatus.ACCEPTED, acceptResult.getData().getStatus());


        //el request es aceptado
        var placeAfterAccept = placeRepository.findById(place.getId());
        assertTrue(placeAfterAccept.isPresent(), "Place should still exist");
        assertEquals(PlaceStatus.RESERVED, placeAfterAccept.get().getStatus());

        var bookingResult = bookingRepository.findAll();
        assertEquals(1, bookingResult.size());
        Booking booking = bookingResult.getFirst();
        assertEquals(bookingRequestId, booking.getBookingRequest().getId());
        assertEquals(place.getId(), booking.getPlace().getId());
        assertEquals(BookingStatus.COMPLETED, booking.getStatus());
        assertEquals(updatedStart, booking.getStartTime());
        assertEquals(updatedEnd, booking.getEndTime());
    }

}
