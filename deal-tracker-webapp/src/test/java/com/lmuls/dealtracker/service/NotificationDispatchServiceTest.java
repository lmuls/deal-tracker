package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.entity.*;
import com.lmuls.dealtracker.enums.*;
import com.lmuls.dealtracker.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationDispatchServiceTest {

    @Mock DealRepository dealRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock UserRepository userRepository;
    @Mock UserPreferenceRepository preferenceRepository;
    @Mock EmailService emailService;

    private NotificationDispatchService service;
    private User testUser;
    private TrackedSite testSite;
    private Deal testDeal;

    @BeforeEach
    void setUp() {
        service = new NotificationDispatchService(
                dealRepository, notificationRepository,
                userRepository, preferenceRepository, emailService);

        testUser = User.builder().id(UUID.randomUUID()).email("test@example.com").build();
        testSite = TrackedSite.builder()
                .id(UUID.randomUUID()).user(testUser)
                .url("https://shop.com").name("Shop").checkInterval("1 hour")
                .build();
        testDeal = Deal.builder()
                .id(UUID.randomUUID()).trackedSite(testSite)
                .type(DealType.SALE_EVENT).title("Spring Sale")
                .confidence(Confidence.HIGH)
                .detectionLayer(DetectionLayer.STRUCTURED_DATA)
                .detectedAt(Instant.now())
                .active(true).build();
    }

    @Test
    void createsInAppNotificationForNewDeal() {
        when(dealRepository.findByDetectedAtAfterOrderByDetectedAtAsc(any()))
                .thenReturn(List.of(testDeal));
        when(preferenceRepository.findByUserId(testUser.getId()))
                .thenReturn(Optional.of(UserPreference.builder()
                        .user(testUser).notifyInApp(true).notifyEmail(false).build()));

        service.dispatchNotifications();

        var captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getChannel()).isEqualTo(NotificationChannel.IN_APP);
        assertThat(captor.getValue().getStatus()).isEqualTo(NotificationStatus.SENT);
    }

    @Test
    void sendsEmailAndCreatesEmailNotificationForInstantPreference() {
        when(dealRepository.findByDetectedAtAfterOrderByDetectedAtAsc(any()))
                .thenReturn(List.of(testDeal));
        when(preferenceRepository.findByUserId(testUser.getId()))
                .thenReturn(Optional.of(UserPreference.builder()
                        .user(testUser)
                        .notifyInApp(true).notifyEmail(true)
                        .emailFrequency(EmailFrequency.INSTANT).build()));

        service.dispatchNotifications();

        verify(emailService).sendDealAlert(testUser, testDeal);
        // Should save 2 notifications: in-app + email
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void doesNotSendEmailForDailyDigestPreference() {
        when(dealRepository.findByDetectedAtAfterOrderByDetectedAtAsc(any()))
                .thenReturn(List.of(testDeal));
        when(preferenceRepository.findByUserId(testUser.getId()))
                .thenReturn(Optional.of(UserPreference.builder()
                        .user(testUser)
                        .notifyInApp(true).notifyEmail(true)
                        .emailFrequency(EmailFrequency.DAILY_DIGEST).build()));

        service.dispatchNotifications();

        verifyNoInteractions(emailService);
    }

    @Test
    void doesNothingWhenNoNewDeals() {
        when(dealRepository.findByDetectedAtAfterOrderByDetectedAtAsc(any()))
                .thenReturn(List.of());

        service.dispatchNotifications();

        verifyNoInteractions(notificationRepository);
        verifyNoInteractions(emailService);
    }
}
