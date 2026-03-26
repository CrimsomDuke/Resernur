
package com.resernur.api.models;

import com.resernur.api.models.Booking;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class File {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String filePath;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "bookingId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_file_booking"))
    private Booking booking;

    // Getters and setters
}
