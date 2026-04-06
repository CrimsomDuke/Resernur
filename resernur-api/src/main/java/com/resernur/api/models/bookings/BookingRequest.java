package com.resernur.api.models.bookings;

import com.resernur.api.models.enums.ActivityType;
import com.resernur.api.models.files.File;
import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.places.Place;
import com.resernur.api.models.users.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class BookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "userId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_bookingRequest_user"))
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "placeId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_bookingRequest_place"))
    private Place place;

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime requestedStartTime;

    @Column(nullable = false)
    private LocalDateTime requestedEndTime;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingRequestStatus status = BookingRequestStatus.PENDING;

    @ManyToOne
    @JoinColumn(name = "attachmentFileId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_bookingRequest_file"))
    private File attachmentFile;

    @Column(nullable = true)
    private String changesRequestedReason; // only visible when status is "CHANGES_REQUESTED"

    @Column
    private ActivityType activityType = ActivityType.ACADEMICO;

}
