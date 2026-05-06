package com.resernur.api.unittest.controllers.bookings;

import com.resernur.api.controllers.bookings.BookingRequestController;
import com.resernur.api.dtos.bookings.BookingRequestCreateDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.bookings.BookingRequestReasonBodyDTO;
import com.resernur.api.dtos.bookings.BookingRequestUpdateDTO;
import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.enums.ActivityType;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.users.User;
import com.resernur.api.services.bookings.BookingRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BookingRequestControllerTests {

    @Mock
    private BookingRequestService bookingRequestService;

    @InjectMocks
    private BookingRequestController bookingRequestController;

    private User testUser;

    @BeforeEach
    public void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("password")
                .role(UserRole.ADMINISTRADOR)
                .build();
    }

    @Test
    public void create_WhenServiceReturnsSuccess_ShouldReturnCreated() throws ResernurException, IOException {
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setUserId(1);
        dto.setPlaceId(2);
        dto.setReason("Meeting");
        dto.setActivityType(ActivityType.OTRO);
        dto.setRequestedStartTime(LocalDateTime.now().plusDays(1));
        dto.setRequestedEndTime(LocalDateTime.now().plusDays(1).plusHours(2));

        BookingRequestDTO returned = new BookingRequestDTO();
        returned.setId(10);
        returned.setUserId(dto.getUserId());
        returned.setPlaceId(dto.getPlaceId());
        returned.setReason(dto.getReason());

        StandardResult<BookingRequestDTO> success = new StandardResult<>(true, "", returned);

        when(bookingRequestService.createBookingRequest(eq(dto), anyInt())).thenReturn(success);

        var response = bookingRequestController.create(dto, testUser);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(returned.getId(), response.getBody().getData().getId());
    }

    @Test
    public void create_WhenServiceReturnsFailure_ShouldReturnBadRequest() throws ResernurException, IOException {
        BookingRequestCreateDTO dto = new BookingRequestCreateDTO();
        dto.setUserId(1);
        dto.setPlaceId(2);

        StandardResult<BookingRequestDTO> fail = new StandardResult<>(false, "validation error", null);
        when(bookingRequestService.createBookingRequest(eq(dto), anyInt())).thenReturn(fail);

        var response = bookingRequestController.create(dto, testUser);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("validation error", response.getBody().getErrorMessage());
    }

    @Test
    public void testGetById_Success(){
        BookingRequestDTO dto = new BookingRequestDTO();
        dto.setId(10);
        dto.setUserId(1);
        dto.setPlaceId(2);
        dto.setReason("Meeting");

        StandardResult<BookingRequestDTO> success = new StandardResult<>(true, "", dto);
        when(bookingRequestService.getById(10)).thenReturn(success);

        var response = bookingRequestController.getById(10);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(dto.getId(), response.getBody().getData().getId());
    }

    @Test
    public void testGetById_NotFound() {
        StandardResult<BookingRequestDTO> notFound = new StandardResult<>(false, "not found", null);
        when(bookingRequestService.getById(99)).thenReturn(notFound);
        var response = bookingRequestController.getById(99);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertNull(response.getBody().getData());
    }

    @Test
    public void testAccept_Success(){

        //Arrange
        BookingRequestReasonBodyDTO dto = new BookingRequestReasonBodyDTO();
        dto.setReason("asdasd");

        int requestId = 10;

        BookingRequestDTO returned = new BookingRequestDTO();
        returned.setId(requestId);

        StandardResult<BookingRequestDTO> success = new StandardResult<>(true, "", returned);

        when(bookingRequestService.acceptRequest(requestId, Math.toIntExact(testUser.getId())))
                .thenReturn(success);

        //Act
        var response = bookingRequestController.accept(requestId, testUser);

        //  assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(requestId, response.getBody().getData().getId());
        Mockito.verify(bookingRequestService, Mockito.times(1)).acceptRequest(requestId, Math.toIntExact(testUser.getId()));

    }

    @Test
    public void testAccept_NotFound() {
        int requestId = 99;
        StandardResult<BookingRequestDTO> notFound = new StandardResult<>(false, "not found", null);
        when(bookingRequestService.acceptRequest(requestId, Math.toIntExact(testUser.getId()))).thenReturn(notFound);
        var response = bookingRequestController.accept(requestId, testUser);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void testReject_Success() {
        int requestId = 10;
        BookingRequestController.ReasonBody body = new BookingRequestController.ReasonBody();
        body.reason = "No disponible";
        BookingRequestDTO returned = new BookingRequestDTO();
        returned.setId(requestId);
        StandardResult<BookingRequestDTO> success = new StandardResult<>(true, "", returned);
        when(bookingRequestService.rejectRequest(eq(requestId), eq(body.reason), anyInt())).thenReturn(success);
        var response = bookingRequestController.reject(requestId, body, testUser);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(requestId, response.getBody().getData().getId());
    }

    @Test
    public void testReject_NotFound() {
        int requestId = 10;
        BookingRequestController.ReasonBody body = new BookingRequestController.ReasonBody();
        body.reason = "No disponible";
        StandardResult<BookingRequestDTO> notFound = new StandardResult<>(false, "not found", null);
        when(bookingRequestService.rejectRequest(eq(requestId), eq(body.reason), anyInt())).thenReturn(notFound);
        var response = bookingRequestController.reject(requestId, body, testUser);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    public void testRequestChanges_Success() {
        int requestId = 11;
        BookingRequestController.ReasonBody body = new BookingRequestController.ReasonBody();
        body.reason = "Falta información";
        BookingRequestDTO returned = new BookingRequestDTO();
        returned.setId(requestId);
        StandardResult<BookingRequestDTO> success = new StandardResult<>(true, "", returned);
        when(bookingRequestService.requestChanges(eq(requestId), eq(body.reason), anyInt())).thenReturn(success);
        var response = bookingRequestController.requestChanges(requestId, body, testUser);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(requestId, response.getBody().getData().getId());
    }

    @Test
    public void testRequestChanges_NotFound() {
        int requestId = 99;
        BookingRequestController.ReasonBody body = new BookingRequestController.ReasonBody();
        body.reason = "Falta información";
        StandardResult<BookingRequestDTO> notFound = new StandardResult<>(false, "not found", null);
        when(bookingRequestService.requestChanges(eq(requestId), eq(body.reason), anyInt())).thenReturn(notFound);
        var response = bookingRequestController.requestChanges(requestId, body, testUser);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    public void testUpdateByRequester_Success() throws ResernurException {
        int requestId = 12;
        BookingRequestDTO returned = new BookingRequestDTO();
        returned.setId(requestId);
        BookingRequestUpdateDTO updateDTO = new BookingRequestUpdateDTO();
        updateDTO.setId(requestId);
        StandardResult<BookingRequestDTO> success = new StandardResult<>(true, "", returned);
        when(bookingRequestService.updateByRequester(eq(requestId), eq(updateDTO), anyInt())).thenReturn(success);
        var response = bookingRequestController.updateByRequester(requestId, updateDTO, testUser);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(requestId, response.getBody().getData().getId());
    }

    @Test
    public void testUpdateByRequester_NotFound() throws ResernurException {
        int requestId = 12;
        BookingRequestUpdateDTO updateDTO = new BookingRequestUpdateDTO();
        updateDTO.setId(requestId);
        StandardResult<BookingRequestDTO> notFound = new StandardResult<>(false, "not found", null);
        when(bookingRequestService.updateByRequester(eq(requestId), eq(updateDTO), anyInt())).thenReturn(notFound);
        var response = bookingRequestController.updateByRequester(requestId, updateDTO, testUser);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    public void testDeleteRequest_Success() {
        int requestId = 13;
        int requesterId = 1;
        StandardResult<Void> success = new StandardResult<>(true, "", null);
        when(bookingRequestService.delete(eq(requestId), eq(requesterId))).thenReturn(success);
        var response = bookingRequestController.deleteRequest(requestId, requesterId);
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    public void testDeleteRequest_NotFound() {
        int requestId = 13;
        int requesterId = 1;
        StandardResult<Void> notFound = new StandardResult<>(false, "not found", null);
        when(bookingRequestService.delete(eq(requestId), eq(requesterId))).thenReturn(notFound);
        var response = bookingRequestController.deleteRequest(requestId, requesterId);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    public void testGetByUserPaged() {
        int userId = 1;
        PagedResponse<BookingRequestDTO> paged = new PagedResponse<>();
        when(bookingRequestService.getByUserPaged(eq(userId), Mockito.any())).thenReturn(paged);
        var response = bookingRequestController.getByUserPaged(userId, 0, 10);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }

    @Test
    public void testGetAllPaged_ValidStatus() {
        PagedResponse<BookingRequestDTO> paged = new PagedResponse<>();
        when(bookingRequestService.getAllPaged(Mockito.any(), Mockito.any())).thenReturn(paged);
        var response = bookingRequestController.getAllPaged("PENDING", 0, 10);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }

    @Test
    public void testGetAllPaged_InvalidStatus() {
        var response = bookingRequestController.getAllPaged("INVALID_STATUS", 0, 10);
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

}
