package com.resernur.api.unittest.services.bookings;

import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.bookings.BookingRequestUpdateDTO;
import com.resernur.api.dtos.bookings.BookingDTO;
import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.Actions;
import com.resernur.api.models.enums.ActivityType;
import com.resernur.api.models.enums.BookingRequestStatus;
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
// ...existing code...
import com.resernur.api.utils.components.bookings.BookingRequestValidationComponent;
import com.resernur.api.utils.components.config_parameters.ConfigurationProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
// ...existing code...
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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

    // ...existing code...

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
    private BookingRequest bookingRequest;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @BeforeEach
    public void setup() throws ResernurException {
        startTime = LocalDateTime.now().plusDays(1);
        endTime = startTime.plusHours(2);

        user = new User(1L, "test@gmail.com", "test", "test", UserRole.ADMINISTRADOR);
        place = new Place();
        place.setId(20);
        place.setName("Aula Test");
        place.setUserInCharge(user);
        place.setCapacity(20);
        place.setDescription("Testing purposes");

        bookingRequest = new BookingRequest();
        bookingRequest.setId(1);
        bookingRequest.setActivityType(ActivityType.ACADEMICO);
        bookingRequest.setUser(user);
        bookingRequest.setPlace(place);
        bookingRequest.setReason("Testing purposes");
        bookingRequest.setRequestedStartTime(startTime);
        bookingRequest.setRequestedEndTime(endTime);
    }

    @Test
    public void createBookingRequest_Success() throws ResernurException, IOException {
        // arrange
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setUserId(user.getId().intValue());
        dto.setActivityType(ActivityType.ACADEMICO);
        dto.setReason("Testing purposes");
        dto.setRequestedStartTime(startTime);
        dto.setRequestedEndTime(endTime);
        dto.setPlaceId(place.getId());

        when(userRepository.findById(eq(user.getId())))
                .thenReturn(Optional.of(user));

        when(placeRepository.findById(eq(place.getId())))
                .thenReturn(Optional.of(place));

        // Métodos void ya stubbeados en setup
        when(bookingRequestRepository.save(any(BookingRequest.class))).thenReturn(bookingRequest);

        // act
        StandardResult<BookingRequestDTO> result = bookingRequestService.createBookingRequest(dto, user.getId().intValue());

        // assert
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(bookingRequest.getId(), result.getData().getId());

        verify(bookingRequestValidationComponent, times(1)).validateUserAndPlace(eq(dto), any(), any());
        verify(bookingRequestValidationComponent, times(1)).validateBookingTimes(any(), eq(startTime), eq(endTime), eq(configurationProvider));
        verify(bookingRequestValidationComponent, times(1)).validateOverlappingOnCreate(eq(dto), eq(bookingRequestRepository));
        verify(bookingRequestRepository, times(1)).save(any(BookingRequest.class));
        verify(notificationService, times(1)).createNotification(eq(user.getId()), eq("Tu solicitud de reserva fue enviada y esta pendiente de revision"));
        verify(logService, times(1)).logAction(eq(Actions.CREATE), eq(user.getId().intValue()), eq("BOOKING_REQUEST"), eq(bookingRequest.getId()));
    }

    @Test
    public void getById_Success() {
        when(bookingRequestRepository.findById(eq(bookingRequest.getId())))
                .thenReturn(Optional.of(bookingRequest));

        StandardResult<BookingRequestDTO> result = bookingRequestService.getById(bookingRequest.getId());

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(bookingRequest.getId(), result.getData().getId());
        verify(bookingRequestRepository, times(1)).findById(eq(bookingRequest.getId()));
    }

    @Test
    public void getByUserPaged_Success() {
        SearchQuery query = new SearchQuery("", 0, 10);
        Pageable pageable = PageRequest.of(0, 10);
        PageImpl<BookingRequest> page = new PageImpl<>(List.of(bookingRequest), pageable, 1);

        when(bookingRequestRepository.findAllByUserId(eq(user.getId().intValue()), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<BookingRequestDTO> result = bookingRequestService.getByUserPaged(user.getId().intValue(), query);

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals(1, result.getContent().size());
        verify(bookingRequestRepository, times(1)).findAllByUserId(eq(user.getId().intValue()), any(Pageable.class));
    }

    @Test
    public void getAllPaged_Success() {
        SearchQuery query = new SearchQuery("", 0, 5);
        Pageable pageable = PageRequest.of(0, 5);
        PageImpl<BookingRequest> page = new PageImpl<>(List.of(bookingRequest), pageable, 1);

        when(bookingRequestRepository.findByStatus(eq(BookingRequestStatus.PENDING), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<BookingRequestDTO> result = bookingRequestService.getAllPaged(query, BookingRequestStatus.PENDING);

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals(1, result.getContent().size());
        verify(bookingRequestRepository, times(1)).findByStatus(eq(BookingRequestStatus.PENDING), any(Pageable.class));
    }

    @Test
    public void getAllPaged_NoStatus(){
        SearchQuery query = new SearchQuery("", 0, 5);
        Pageable pageable = PageRequest.of(0, 5);
        PageImpl<BookingRequest> page = new PageImpl<>(List.of(bookingRequest), pageable, 1);

        when(bookingRequestRepository.findAll(pageable))
                .thenReturn(page);

        PagedResponse<BookingRequestDTO> result = bookingRequestService.getAllPaged(query, null);
        assertNotNull(result);
        assertTrue(result.isSuccess());
        verify(bookingRequestRepository, times(1)).findAll(pageable);
    }

    @Test
    public void updateByRequester_Success() throws ResernurException {
        bookingRequest.setStatus(BookingRequestStatus.CHANGES_REQUESTED);

        BookingRequestUpdateDTO dto = new BookingRequestUpdateDTO();
        dto.setUserId(user.getId().intValue());
        dto.setReason("Updated reason");
        dto.setRequestedStartTime(startTime.plusDays(1));
        dto.setRequestedEndTime(endTime.plusDays(1));

        when(bookingRequestRepository.findById(eq(bookingRequest.getId())))
                .thenReturn(Optional.of(bookingRequest));
        org.mockito.Mockito.doNothing().when(bookingRequestValidationComponent).validateUpdateRequestFields(eq(dto), eq(bookingRequest));
        org.mockito.Mockito.doNothing().when(bookingRequestValidationComponent).validateBookingTimes(any(), eq(dto.getRequestedStartTime()), eq(dto.getRequestedEndTime()), eq(configurationProvider));
        org.mockito.Mockito.doNothing().when(bookingRequestValidationComponent).validateOverlappingOnUpdate(eq(dto), eq(bookingRequest), eq(bookingRequestRepository));
        when(bookingRequestRepository.save(eq(bookingRequest))).thenReturn(bookingRequest);

        StandardResult<BookingRequestDTO> result = bookingRequestService.updateByRequester(bookingRequest.getId(), dto, user.getId().intValue());

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(BookingRequestStatus.PENDING, result.getData().getStatus());
        verify(bookingRequestValidationComponent, times(1)).validateUpdateRequestFields(eq(dto), eq(bookingRequest));
        verify(bookingRequestValidationComponent, times(1)).validateBookingTimes(any(), eq(dto.getRequestedStartTime()), eq(dto.getRequestedEndTime()), eq(configurationProvider));
        verify(bookingRequestValidationComponent, times(1)).validateOverlappingOnUpdate(eq(dto), eq(bookingRequest), eq(bookingRequestRepository));
        verify(bookingRequestRepository, times(1)).save(eq(bookingRequest));
        verify(logService, times(1)).logAction(eq(Actions.UPDATE), eq(user.getId().intValue()), eq("BOOKING_REQUEST"), eq(bookingRequest.getId()));
    }

    @Test
    public void deleteRequest_Success() {
        when(bookingRequestRepository.findById(eq(bookingRequest.getId())))
                .thenReturn(Optional.of(bookingRequest));

        StandardResult<Void> result = bookingRequestService.deleteRequest(bookingRequest.getId(), user.getId().intValue());

        assertNotNull(result);
        assertTrue(result.isSuccess());
        verify(bookingRequestRepository, times(1)).deleteById(eq(bookingRequest.getId()));
    }

    @Test
    public void delete_Success() {
        when(bookingRequestRepository.findById(eq(bookingRequest.getId())))
                .thenReturn(Optional.of(bookingRequest));

        StandardResult<Void> result = bookingRequestService.delete(bookingRequest.getId(), user.getId().intValue());

        assertNotNull(result);
        assertTrue(result.isSuccess());
        verify(bookingRequestRepository, times(1)).deleteById(eq(bookingRequest.getId()));
    }

    @Test
    public void acceptRequest_Success() {
        BookingRequest overlap = new BookingRequest();
        overlap.setId(2);
        overlap.setUser(user);
        overlap.setPlace(place);
        overlap.setRequestedStartTime(startTime.plusHours(1));
        overlap.setRequestedEndTime(endTime.plusHours(1));
        overlap.setStatus(BookingRequestStatus.PENDING);

        BookingDTO bookingDTO = new BookingDTO();
        bookingDTO.setBookingRequestId(bookingRequest.getId());

        when(bookingRequestRepository.findById(eq(bookingRequest.getId())))
                .thenReturn(Optional.of(bookingRequest));
        when(bookingRequestRepository.save(any(BookingRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRequestRepository.findByPlace_IdAndStatusInAndRequestedStartTimeLessThanEqualAndRequestedEndTimeGreaterThanEqual(
                eq(place.getId()), any(), eq(endTime), eq(startTime)
        )).thenReturn(List.of(bookingRequest, overlap));
        when(bookingService.createBookingFromRequest(eq(bookingRequest)))
                .thenReturn(new StandardResult<>(true, "", bookingDTO));

        StandardResult<BookingRequestDTO> result = bookingRequestService.acceptRequest(bookingRequest.getId(), user.getId().intValue());

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(BookingRequestStatus.ACCEPTED, result.getData().getStatus());
        verify(bookingRequestRepository, atLeastOnce()).save(any(BookingRequest.class));
        verify(bookingService, times(1)).createBookingFromRequest(eq(bookingRequest));
        verify(notificationService, atLeastOnce()).createNotification(eq(user.getId()), anyString());
        verify(logService, times(1)).logAction(eq(Actions.APPROVE), eq(user.getId().intValue()), eq("BOOKING_REQUEST"), eq(bookingRequest.getId()));
    }

    @Test
    public void rejectRequest_Success() {
        when(bookingRequestRepository.findById(eq(bookingRequest.getId())))
                .thenReturn(Optional.of(bookingRequest));
        when(bookingRequestRepository.save(any(BookingRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        StandardResult<BookingRequestDTO> result = bookingRequestService.rejectRequest(bookingRequest.getId(), "No hay disponibilidad", user.getId().intValue());

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(BookingRequestStatus.REJECTED, result.getData().getStatus());
        verify(bookingRequestRepository, times(1)).save(eq(bookingRequest));
        verify(notificationService, times(1)).createNotification(eq(user.getId()), eq("Se rechazo tu solicitud. Reason: No hay disponibilidad"));
        verify(logService, times(1)).logAction(eq(Actions.REJECT), eq(user.getId().intValue()), eq("BOOKING_REQUEST"), eq(bookingRequest.getId()));
    }

    @Test
    public void requestChanges_Success() {
        when(bookingRequestRepository.findById(eq(bookingRequest.getId())))
                .thenReturn(Optional.of(bookingRequest));
        when(bookingRequestRepository.save(any(BookingRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        StandardResult<BookingRequestDTO> result = bookingRequestService.requestChanges(bookingRequest.getId(), "Falta detalle", user.getId().intValue());

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(BookingRequestStatus.CHANGES_REQUESTED, result.getData().getStatus());
        verify(bookingRequestRepository, times(1)).save(eq(bookingRequest));
        verify(notificationService, times(1)).createNotification(eq(user.getId()), eq("Se solicitaron cambios. Reason: Falta detalle"));
        verify(logService, times(1)).logAction(eq(Actions.REJECT), eq(user.getId().intValue()), eq("BOOKING_REQUEST"), eq(bookingRequest.getId()));
    }

}
