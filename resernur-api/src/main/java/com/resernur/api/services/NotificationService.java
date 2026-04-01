package com.resernur.api.services;

import com.resernur.api.dtos.notifications.NotificationDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.notifications.Notification;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.notifications.NotificationRepository;
import com.resernur.api.repositories.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // Get paged notifications for user
    public PagedResponse<NotificationDTO> getAllByUser(Long userId, SearchQuery query) {
        int page = Math.max(0, query == null ? 0 : query.page);
        int pageSize = Math.max(1, query == null ? 10 : query.pageSize);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Notification> pageResult = notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
        var content = pageResult.getContent().stream().map(this::toDTO).collect(Collectors.toList());
        return new PagedResponse<>(content, pageResult.getNumber(), pageResult.getSize(), pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.isLast(), true, "");
    }

    // Get unread notifications and mark them as read
    @Transactional
    public List<NotificationDTO> getUnreadAndMarkRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtAsc(userId);
        if (unread == null || unread.isEmpty()) return List.of();
        // mark as read
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return unread.stream().map(this::toDTO).collect(Collectors.toList());
    }

    // Create notification (service-only)
    @Transactional
    public StandardResult<NotificationDTO> createNotification(Long userId, String message) {
        if (userId == null || message == null || message.isBlank()) return new StandardResult<>(false, "Invalid input", null);
        Optional<User> optUser = userRepository.findById(userId);
        if (optUser.isEmpty()) return new StandardResult<>(false, "User not found", null);
        Notification n = new Notification();
        n.setUser(optUser.get());
        n.setMessage(message);
        n.setRead(false);
        Notification saved = notificationRepository.save(n);
        return new StandardResult<>(true, "", toDTO(saved));
    }

    private NotificationDTO toDTO(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setUserId(n.getUser() != null ? n.getUser().getId() : null);
        dto.setMessage(n.getMessage());
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }

}
