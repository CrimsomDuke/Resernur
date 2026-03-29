package com.resernur.api.dtos.bookings;

import com.resernur.api.models.enums.BookingRequestStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequestCreateDTO {
    private int userId;
    private int placeId;
    private String reason;
    private LocalDateTime requestedStartTime;
    private LocalDateTime requestedEndTime;
}
