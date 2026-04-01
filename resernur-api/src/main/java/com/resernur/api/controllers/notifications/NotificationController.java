package com.resernur.api.controllers.notifications;

import com.resernur.api.dtos.notifications.NotificationDTO;
import com.resernur.api.dtos.pojos.PagedResponse;
import com.resernur.api.dtos.pojos.SearchQuery;
import com.resernur.api.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedResponse<NotificationDTO>> getByUser(
            @PathVariable Long userId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "pageSize", defaultValue = "10") int pageSize
    ) {
        var q = new SearchQuery(null, page, pageSize);
        var res = notificationService.getAllByUser(userId, q);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadAndMarkRead(@PathVariable Long userId) {
        var list = notificationService.getUnreadAndMarkRead(userId);
        return ResponseEntity.ok(list);
    }

}
