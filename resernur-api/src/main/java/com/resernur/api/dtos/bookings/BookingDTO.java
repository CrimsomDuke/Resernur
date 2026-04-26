package com.resernur.api.dtos.bookings;

import com.resernur.api.models.enums.ActivityType;
import com.resernur.api.models.enums.BookingStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingDTO {
    private int id;
    private int placeId;
    private int bookingRequestId;
    private BookingRequestDTO bookingRequest;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BookingStatus status;
    private ActivityType activityType;
    private boolean isOngoing = false; // dinamicamente piesto con toDTO

    public void calculateOngoing() {
        LocalDateTime now = LocalDateTime.now();
        this.isOngoing = (startTime.isBefore(now) || startTime.isEqual(now)) && (endTime.isAfter(now) || endTime.isEqual(now));
    }
}

