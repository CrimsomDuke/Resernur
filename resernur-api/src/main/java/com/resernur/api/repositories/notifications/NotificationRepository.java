package com.resernur.api.repositories.notifications;

import com.resernur.api.models.notifications.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    Page<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtAsc(Long userId);
}
