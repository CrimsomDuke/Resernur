package com.resernur.api.unittest.controllers.bookings;

import com.resernur.api.controllers.bookings.BookingController;
import com.resernur.api.dtos.bookings.BookingDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.users.User;
import com.resernur.api.services.bookings.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BookingControllerTests {

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController bookingController;

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
    public void getById_Success() {
        BookingDTO dto = new BookingDTO();
        dto.setId(1);
        StandardResult<BookingDTO> result = new StandardResult<>(true, "", dto);
        when(bookingService.getById(1)).thenReturn(result);
        var response = bookingController.getById(1);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getId());
    }

    @Test
    public void getById_NotFound() {
        StandardResult<BookingDTO> result = new StandardResult<>(false, "No encontrado", null);
        when(bookingService.getById(99)).thenReturn(result);
        var response = bookingController.getById(99);
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertNull(response.getBody().getData());
    }

    @Test
    public void search_Success() {
        PagedResponse<BookingDTO> paged = new PagedResponse<>();
        when(bookingService.search(any(), any(), any(), any())).thenReturn(paged);
        var response = bookingController.search(null, null, null, 0, 10);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }

    @Test
    public void search_WithFilters() {
        PagedResponse<BookingDTO> paged = new PagedResponse<>();
        when(bookingService.search(any(SearchQuery.class), eq(BookingStatus.COMPLETED), eq(1), eq(true))).thenReturn(paged);
        var response = bookingController.search(BookingStatus.COMPLETED.name(), 1, true, 0, 10);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(paged, response.getBody());
    }

    @Test
    public void cancel_Success() {
        StandardResult<Void> result = new StandardResult<>(true, "", null);
        when(bookingService.cancelBooking(1)).thenReturn(result);
        var response = bookingController.cancel(1);
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    public void cancel_NotFound() {
        StandardResult<Void> result = new StandardResult<>(false, "No encontrado", null);
        when(bookingService.cancelBooking(99)).thenReturn(result);
        var response = bookingController.cancel(99);
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

}
