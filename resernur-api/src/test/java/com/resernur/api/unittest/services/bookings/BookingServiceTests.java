package com.resernur.api.unittest.services.bookings;

import com.resernur.api.dtos.bookings.BookingDTO;
import com.resernur.api.dtos.bookings.BookingRequestDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.bookings.BookingRepository;
import com.resernur.api.services.auditlogs.LogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTests {
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private LogService logService;
    @InjectMocks
    private com.resernur.api.services.bookings.BookingService bookingService;

    private BookingRequest bookingRequest;
    private Booking booking;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private User user;

    @BeforeEach
    void setup() {

        user = new User(1L, "test@gmail.com", "test", "test", UserRole.ADMINISTRADOR);

        startTime = LocalDateTime.now().plusDays(1);
        endTime = startTime.plusHours(2);
        bookingRequest = new BookingRequest();
        bookingRequest.setId(1);
        bookingRequest.setStatus(BookingRequestStatus.ACCEPTED);
        bookingRequest.setRequestedStartTime(startTime);
        bookingRequest.setRequestedEndTime(endTime);

        bookingRequest.setUser(user);

        booking = new Booking();
        booking.setId(10);
        booking.setBookingRequest(bookingRequest);
        booking.setPlace(null);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setStatus(BookingStatus.COMPLETED);
    }

    @Test
    void createBookingFromRequest_Success() {
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);
        StandardResult<BookingDTO> result = bookingService.createBookingFromRequest(bookingRequest);
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(booking.getId(), result.getData().getId());
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void getById_Success() {
        when(bookingRepository.findById(eq(booking.getId()))).thenReturn(Optional.of(booking));
        StandardResult<BookingDTO> result = bookingService.getById(booking.getId());
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(booking.getId(), result.getData().getId());
        verify(bookingRepository, times(1)).findById(eq(booking.getId()));
    }

    @Test
    void search_Success() {
        SearchQuery query = new SearchQuery("", 0, 5);
        Pageable pageable = PageRequest.of(0, 5);
        PageImpl<Booking> page = new PageImpl<>(List.of(booking), pageable, 1);
        when(bookingRepository.findAll(any(Pageable.class))).thenReturn(page);
        PagedResponse<BookingDTO> result = bookingService.search(query, null, null, false);
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals(1, result.getContent().size());
        verify(bookingRepository, times(1)).findAll(any(Pageable.class));
    }

    @Test
    void cancelBooking_Success() {
        booking.setStatus(BookingStatus.COMPLETED);
        when(bookingRepository.findById(eq(booking.getId()))).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);
        StandardResult<Void> result = bookingService.cancelBooking(booking.getId());
        assertNotNull(result);
        assertTrue(result.isSuccess());
        verify(bookingRepository, times(1)).findById(eq(booking.getId()));
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }
}
