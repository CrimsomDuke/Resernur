package com.resernur.api.dtos.bookings;

import com.resernur.api.models.enums.BookingRequestStatus;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Data
public class BookingRequestCreateDTO {
    private int userId;
    private int placeId;
    private String reason;

    @DateTimeFormat(iso =  DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime requestedStartTime;
    @DateTimeFormat(iso =  DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime requestedEndTime;

    private MultipartFile attachmentFile; // optional file upload
}
