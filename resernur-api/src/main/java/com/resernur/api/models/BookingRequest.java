package com.resernur.api.models;

import com.resernur.api.models.enums.BookingRequestStatus;
import com.resernur.api.models.users.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class BookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "userId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_bookingRequest_user"))
    private User user;

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingRequestStatus status = BookingRequestStatus.PENDING;

    @ManyToOne
    @JoinColumn(name = "attachmentFileId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_bookingRequest_file"))
    private File attachmentFile;

    @Column(nullable = true)
    private String ChangesRequestedReason; //only visible when status is "Changes Requested"
}
