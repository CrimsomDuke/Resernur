package com.resernur.api.integrationtests.booking;

import com.resernur.api.dtos.auth.RegisterDTO;
import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.enums.ActivityType;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.users.User;
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
    private AuthService authService;

    private User user;
    private User adminUser;
    private Place place;

    @BeforeEach
    public void setup(){
        userRepository.deleteAll();
        placeRepository.deleteAll();

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
        place = placeRepository.save(place);
    }

    @Test
    public void createBookingRequestAndAccept() throws ResernurException, IOException {
        // Arrange: Create booking request DTO
        LocalDateTime startTime = LocalDateTime.now().plusDays(3);
        startTime = startTime.withHour(10);
        LocalDateTime endTime = startTime.plusHours(2);

        BookingRequestCreateDTO requestDTO = new BookingRequestCreateDTO();
        requestDTO.setUserId(user.getId().intValue());
        requestDTO.setPlaceId(place.getId());
        requestDTO.setReason("Clase de programación");
        requestDTO.setActivityType(ActivityType.ACADEMICO);
        requestDTO.setRequestedStartTime(startTime);
        requestDTO.setRequestedEndTime(endTime);
        requestDTO.setAttachmentFile(null);

        // Act: Create booking request
        StandardResult<BookingRequestDTO> createResult = bookingRequestService.createBookingRequest(requestDTO, user.getId().intValue());

        // Assert: Booking request created successfully
        assertNotNull(createResult);
        assertTrue(createResult.isSuccess());
        assertNotNull(createResult.getData());
        int bookingRequestId = createResult.getData().getId();
        assertEquals(user.getId().intValue(), createResult.getData().getUserId());
        assertEquals(place.getId(), createResult.getData().getPlaceId());
        assertEquals(BookingRequestStatus.PENDING, createResult.getData().getStatus());

        // Act: Accept booking request
        StandardResult<BookingRequestDTO> acceptResult = bookingRequestService.acceptRequest(bookingRequestId, adminUser.getId().intValue());

        // Assert: Booking request accepted successfully
        assertNotNull(acceptResult);
        assertTrue(acceptResult.isSuccess());
        assertNotNull(acceptResult.getData());
        assertEquals(BookingRequestStatus.ACCEPTED, acceptResult.getData().getStatus());
        assertEquals(bookingRequestId, acceptResult.getData().getId());

        // Verify: The place should still exist after acceptance
        var placeAfterAccept = placeRepository.findById(place.getId());
        assertTrue(placeAfterAccept.isPresent(), "Place should still exist");
        assertEquals(placeAfterAccept.get().getStatus(), PlaceStatus.RESERVED);
    }

    @Test
    public void createBookingRequestAndReject(){

    }

}
