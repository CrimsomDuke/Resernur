package com.resernur.api.unittest.controllers.notifications;

import com.resernur.api.controllers.notifications.NotificationController;
import com.resernur.api.dtos.notifications.NotificationDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.users.User;
import com.resernur.api.services.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class NotificationControllerTests {


    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private User testUser;

    @BeforeEach
    public void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("password")
                .role(UserRole.ADMINISTRADOR)
                .build();
    }

    @Test
    public void getByUser_Success() {
        //arrange
        int page = 0;
        int pageSize = 10;
        Long userId = testUser.getId();

        PagedResponse<NotificationDTO> success = new PagedResponse<>();
        when(notificationService.getAllByUser(eq(userId), any(SearchQuery.class))).thenReturn(success);

        //act
        var response = notificationController.getByUser(userId, page, pageSize);

        //assert
        assertNotNull(response);
        Mockito.verify(notificationService).getAllByUser(eq(userId), any(SearchQuery.class));
    }

    @Test
    public void getUnreadAndMarkRead_Success() {
        //arrange
        Long userId = testUser.getId();
        List<NotificationDTO> list = List.of();
        when(notificationService.getUnreadAndMarkRead(userId)).thenReturn(list);

        //act
        var response = notificationController.getUnreadAndMarkRead(userId);

        //assert
        assertNotNull(response);
        Mockito.verify(notificationService).getUnreadAndMarkRead(userId);
    }
}
