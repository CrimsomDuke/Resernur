package com.resernur.api.dtos.bookings;

import com.resernur.api.models.enums.ActivityType;
import com.resernur.api.models.enums.BookingRequestStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequestDTO {
    private int id;
    private int userId;
    private int placeId;
    private String reason;
    private BookingRequestStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime requestedStartTime;
    private LocalDateTime requestedEndTime;
    private String changesRequestedReason;
    private ActivityType activityType;
    private Integer attachmentFileId; // expose attachment id when present
}
