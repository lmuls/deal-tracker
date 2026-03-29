package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.api.model.NotificationPageResponse;
import com.lmuls.dealtracker.api.model.UnreadCountResponse;
import com.lmuls.dealtracker.enums.NotificationStatus;
import com.lmuls.dealtracker.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserContext userContext;

    @Transactional(readOnly = true)
    public NotificationPageResponse listNotifications(int page, int size) {
        var user = userContext.getDefaultUser();
        var result = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size));

        return new NotificationPageResponse()
                .content(result.getContent().stream().map(DtoMapper::toNotificationResponse).toList())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .page(page)
                .size(size);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount() {
        var user = userContext.getDefaultUser();
        long count = notificationRepository.countByUserIdAndStatus(user.getId(), NotificationStatus.SENT);
        return new UnreadCountResponse().count(count);
    }

    @Transactional
    public void markRead(UUID notificationId) {
        var notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead() {
        var user = userContext.getDefaultUser();
        var unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> n.getStatus() == NotificationStatus.SENT)
                .toList();
        unread.forEach(n -> n.setStatus(NotificationStatus.READ));
        notificationRepository.saveAll(unread);
    }
}
