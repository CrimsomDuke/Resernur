package com.resernur.api.models;

import com.resernur.api.models.users.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "userId", referencedColumnName = "id", foreignKey = @ForeignKey(name = "fk_notification_user"))
    private User user;

    private String message;

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and setters
}
