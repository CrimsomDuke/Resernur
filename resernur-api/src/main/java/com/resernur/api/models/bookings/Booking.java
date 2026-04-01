package com.resernur.api.models.bookings;

import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.models.places.Place;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "placeId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_booking_place"))
    private Place place;

    @ManyToOne(optional = false)
    @JoinColumn(name = "bookingRequestId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_booking_bookingRequest"))
    private BookingRequest bookingRequest;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.COMPLETED;

    // Getters and setters
}
