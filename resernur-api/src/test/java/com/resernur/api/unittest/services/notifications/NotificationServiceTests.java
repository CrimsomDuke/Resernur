package com.resernur.api.unittest.services.notifications;

import com.resernur.api.dtos.notifications.NotificationDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.notifications.Notification;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.notifications.NotificationRepository;
import com.resernur.api.repositories.users.UserRepository;
import com.resernur.api.services.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTests {
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private NotificationService notificationService;

    private User user;
    private Notification notification;

    @BeforeEach
    public void setup() {
        user = new User();
        user.setId(1L);
        user.setFullName("Test User");
        notification = new Notification();
        notification.setId(10);
        notification.setUser(user);
        notification.setMessage("Test message");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
    }

    @Test
    public void getAllByUser_returnsPagedNotifications() {
        Page<Notification> page = new PageImpl<>(List.of(notification), PageRequest.of(0, 10), 1);
        when(notificationRepository.findByUser_IdOrderByCreatedAtDesc(eq(1L), any(Pageable.class))).thenReturn(page);
        SearchQuery query = new SearchQuery();
        query.page = 0;
        query.pageSize = 10;
        PagedResponse<NotificationDTO> result = notificationService.getAllByUser(1L, query);
        assertTrue(result.isSuccess());
        assertEquals(1, result.getContent().size());
        assertEquals(notification.getMessage(), result.getContent().get(0).getMessage());
    }

    @Test
    public void getUnreadAndMarkRead_marksAsReadAndReturnsDTOs() {
        Notification unread = new Notification();
        unread.setId(11);
        unread.setUser(user);
        unread.setMessage("Unread");
        unread.setRead(false);
        when(notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtAsc(1L)).thenReturn(List.of(unread));
        when(notificationRepository.saveAll(anyList())).thenReturn(List.of(unread));
        List<NotificationDTO> result = notificationService.getUnreadAndMarkRead(1L);
        assertEquals(1, result.size());
        assertTrue(result.get(0).isRead());
        verify(notificationRepository).saveAll(anyList());
    }

    @Test
    public void getUnreadAndMarkRead_noUnread_returnsEmptyList() {
        when(notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtAsc(1L)).thenReturn(List.of());
        List<NotificationDTO> result = notificationService.getUnreadAndMarkRead(1L);
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(notificationRepository, never()).saveAll(anyList());
    }

    @Test
    public void createNotification_validInput_createsNotification() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);
        StandardResult<NotificationDTO> result = notificationService.createNotification(1L, "Test message");
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals("Test message", result.getData().getMessage());
    }

    @Test
    public void createNotification_invalidInput_returnsFailure() {
        StandardResult<NotificationDTO> result = notificationService.createNotification(null, "");
        assertFalse(result.isSuccess());
        assertEquals("Invalid input", result.getErrorMessage());
        result = notificationService.createNotification(1L, null);
        assertFalse(result.isSuccess());
        assertEquals("Invalid input", result.getErrorMessage());
    }

    @Test
    public void createNotification_userNotFound_returnsFailure() {
        when(userRepository.findById(2L)).thenReturn(Optional.empty());
        StandardResult<NotificationDTO> result = notificationService.createNotification(2L, "msg");
        assertFalse(result.isSuccess());
        assertEquals("User not found", result.getErrorMessage());
    }
}
