package com.resernur.api.unittest.services.reporting;

import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.repositories.bookings.BookingRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.services.reporting.ReportingService;
import org.apache.poi.ss.usermodel.Workbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportingServiceTests {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PlaceRepository placeRepository;

    @InjectMocks
    private ReportingService reportingService;

    @Test
    public void generateBookingsReport_validData_createsExcelFile() throws Exception {
        // Arrange
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 30);
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);

        Booking booking = new Booking();
        booking.setId(1);
        booking.setStartTime(fromDateTime);
        booking.setEndTime(toDateTime);
        booking.setStatus(BookingStatus.COMPLETED);

        when(bookingRepository.findAllByDateRange(fromDateTime, toDateTime)).thenReturn(List.of(booking));

        // Act
        byte[] report = reportingService.generateBookingsReport(from, to);

        // Assert
        assertNotNull(report);
        assertTrue(report.length > 0);
        verify(bookingRepository, times(1)).findAllByDateRange(fromDateTime, toDateTime);
    }

    @Test
    public void generateMostUsedPlacesReport_validData_createsExcelFile() throws Exception {
        // Arrange
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 30);
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);

        Object[] result = new Object[]{1, 10L};
        when(bookingRepository.findMostUsedPlaces(BookingStatus.COMPLETED, fromDateTime, toDateTime))
                .thenReturn(List.<Object[]>of(result));
        when(placeRepository.findById(1)).thenReturn(Optional.of(new com.resernur.api.models.places.Place()));

        // Act
        byte[] report = reportingService.generateMostUsedPlacesReport(from, to);

        // Assert
        assertNotNull(report);
        assertTrue(report.length > 0);
        verify(bookingRepository, times(1)).findMostUsedPlaces(BookingStatus.COMPLETED, fromDateTime, toDateTime);
        verify(placeRepository, times(1)).findById(1);
    }

    @Test
    public void generateCancelledOrRejectedReport_validData_createsExcelFile() throws Exception {
        // Arrange
        LocalDate from = LocalDate.of(2026, 4, 1);
        LocalDate to = LocalDate.of(2026, 4, 30);
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);

        Booking booking = new Booking();
        booking.setId(1);
        booking.setStartTime(fromDateTime);
        booking.setEndTime(toDateTime);
        booking.setStatus(BookingStatus.CANCELLED);

        when(bookingRepository.findCancelledOrRejected(fromDateTime, toDateTime)).thenReturn(List.of(booking));

        // Act
        byte[] report = reportingService.generateCancelledOrRejectedReport(from, to);

        // Assert
        assertNotNull(report);
        assertTrue(report.length > 0);
        verify(bookingRepository, times(1)).findCancelledOrRejected(fromDateTime, toDateTime);
    }
}
