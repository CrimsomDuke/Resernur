package com.resernur.api.dtos.bookings;

import com.resernur.api.models.enums.BookingStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingDTO {
    private int id;
    private int placeId;
    private int bookingRequestId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BookingStatus status;
}

