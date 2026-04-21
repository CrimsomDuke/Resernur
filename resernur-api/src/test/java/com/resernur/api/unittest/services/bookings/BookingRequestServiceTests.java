package com.resernur.api.unittest.services.bookings;

import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.pojos.CustomError;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.ActivityType;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.NotificationService;
import com.resernur.api.services.auditlogs.LogService;
import com.resernur.api.services.bookings.BookingRequestService;
import com.resernur.api.services.bookings.BookingService;
import com.resernur.api.services.files.FileService;
import com.resernur.api.utils.components.bookings.BookingRequestValidationComponent;
import com.resernur.api.utils.components.config_parameters.ConfigurationProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.internal.verification.Times;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BookingRequestServiceTests {

    @Mock
    private BookingRequestRepository bookingRequestRepository;

    @Mock
    private BookingService bookingService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private FileService fileService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private LogService logService;

    @Mock
    private ConfigurationProvider configurationProvider;

    @Mock
    private BookingRequestValidationComponent bookingRequestValidationComponent;

    @InjectMocks
    private BookingRequestService bookingRequestService;

    //Commons
    private User user;
    private Place place;

    @BeforeEach
    public void setup(){
        user = new User(1L, "test@gmail.com", "test", "test", UserRole.ADMINISTRADOR);
        place = new Place();
        place.setId(20);
        place.setName("Aula Test");
        place.setUserInCharge(user);
        place.setCapacity(20);
        place.setDescription("Testing purposes");

        when(notificationService.createNotification(any(Long.class), any(String.class)))
                .thenReturn(new StandardResult<>());


        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setId(1);
        bookingRequest.setActivityType(ActivityType.ACADEMICO);
        bookingRequest.setUser(user);
        bookingRequest.setPlace(place);
        bookingRequest.setReason("Testing purposes");
        bookingRequest.setRequestedStartTime(LocalDateTime.now());
        bookingRequest.setRequestedEndTime(LocalDateTime.now().plusHours(2));


        when(bookingRequestRepository.save(any()))
                .thenReturn(bookingRequest);
    }

    @Test
    public void createBookingRequest_Success(){
        //arrange
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setUserId(user.getId().intValue());
        dto.setReason("Testing purposes");
        dto.setRequestedStartTime(LocalDateTime.now());
        dto.setRequestedEndTime(LocalDateTime.now().plusHours(2));
        dto.setPlaceId(place.getId());

        when(userRepository.findById(any(Long.class)))
                .thenReturn(Optional.of(user));

        when(placeRepository.findById(any(Integer.class)))
                .thenReturn(Optional.of(place));

        when(bookingRequestValidationComponent.validateUserAndPlaceExistance(any(), any()))
                .thenReturn(null);
        when(bookingRequestValidationComponent.validateBookingTimes(any(), any(), any(), eq(configurationProvider)))
                .thenReturn(null);
        when(bookingRequestValidationComponent.validateOverlappingOnCreate(eq(dto), eq(bookingRequestRepository)))
                .thenReturn(null);

        //act

        StandardResult<BookingRequestDTO> result = bookingRequestService.createBookingRequest(dto, user.getId().intValue());
        //assert

        assertNotNull(result);
        assertTrue(result.isSuccess());
        Mockito.verify(bookingRequestValidationComponent, Mockito.times(1)).validateUserAndPlaceExistance(any(), any());
        Mockito.verify(bookingRequestValidationComponent, Mockito.times(1)).validateBookingTimes(any(), any(), any(), any());
        Mockito.verify(bookingRequestValidationComponent, Mockito.times(1)).validateOverlappingOnCreate(any(), any());

        Mockito.verify(bookingRequestRepository, Mockito.times(1)).save(any());
    }

}
