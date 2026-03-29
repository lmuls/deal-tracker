package com.lmuls.dealtracker.controller;

import com.lmuls.dealtracker.api.NotificationsApi;
import com.lmuls.dealtracker.api.model.NotificationPageResponse;
import com.lmuls.dealtracker.api.model.UnreadCountResponse;
import com.lmuls.dealtracker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class NotificationController implements NotificationsApi {

    private final NotificationService notificationService;

    @Override
    public ResponseEntity<NotificationPageResponse> listNotifications(Integer page, Integer size) {
        return ResponseEntity.ok(notificationService.listNotifications(page, size));
    }

    @Override
    public ResponseEntity<UnreadCountResponse> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    @Override
    public ResponseEntity<Void> markNotificationRead(UUID id) {
        notificationService.markRead(id);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> markAllNotificationsRead() {
        notificationService.markAllRead();
        return ResponseEntity.noContent().build();
    }
}
