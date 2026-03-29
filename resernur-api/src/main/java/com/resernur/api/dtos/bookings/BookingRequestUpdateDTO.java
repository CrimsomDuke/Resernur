package com.resernur.api.dtos.bookings;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequestUpdateDTO {
    private int id;
    private int userId; // requester id for authorization check
    private String reason;
    private LocalDateTime requestedStartTime;
    private LocalDateTime requestedEndTime;
}
