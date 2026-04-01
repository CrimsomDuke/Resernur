package com.resernur.api.dtos.notifications;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private int id;
    private Long userId;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
}

