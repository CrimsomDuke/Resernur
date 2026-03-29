package com.resernur.api.dtos.bookings;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequestUpdateDTO {
    private int id;
    private int placeId;
    private String reason;
    private LocalDateTime requestedStartTime;
    private LocalDateTime requestedEndTime;
}
