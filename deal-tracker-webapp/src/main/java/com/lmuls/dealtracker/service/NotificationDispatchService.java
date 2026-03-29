package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.entity.Notification;
import com.lmuls.dealtracker.entity.User;
import com.lmuls.dealtracker.entity.UserPreference;
import com.lmuls.dealtracker.enums.EmailFrequency;
import com.lmuls.dealtracker.enums.NotificationChannel;
import com.lmuls.dealtracker.enums.NotificationStatus;
import com.lmuls.dealtracker.repository.DealRepository;
import com.lmuls.dealtracker.repository.NotificationRepository;
import com.lmuls.dealtracker.repository.UserPreferenceRepository;
import com.lmuls.dealtracker.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Picks up newly detected deals and creates notification rows.
 *
 * <p>The {@code lastProcessed} cursor is in-memory, initialised to
 * {@code Instant.now()} at startup so that pre-existing deals are not
 * re-notified when the app restarts. For durability across restarts the
 * cursor would need to be persisted (v2 enhancement).
 */
@Service
@Slf4j
public class NotificationDispatchService {

    private final DealRepository dealRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final EmailService emailService;

    private final AtomicReference<Instant> lastProcessed =
            new AtomicReference<>(Instant.now());

    public NotificationDispatchService(
            DealRepository dealRepository,
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            UserPreferenceRepository preferenceRepository,
            @Autowired(required = false) EmailService emailService) {
        this.dealRepository = dealRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.emailService = emailService;
    }

    @Scheduled(fixedDelayString = "${webapp.dispatch-interval-ms:30000}")
    public void dispatchNotifications() {
        Instant since = lastProcessed.get();
        List<Deal> newDeals = dealRepository.findByDetectedAtAfterOrderByDetectedAtAsc(since);
        if (newDeals.isEmpty()) return;

        log.debug("Dispatch tick — {} new deal(s) since {}", newDeals.size(), since);

        for (Deal deal : newDeals) {
            processNewDeal(deal);
        }

        // Advance cursor to just after the last deal we processed
        Instant latest = newDeals.get(newDeals.size() - 1).getDetectedAt();
        lastProcessed.set(latest.plusMillis(1));
    }

    @Scheduled(cron = "${webapp.daily-digest-cron:0 0 8 * * *}")
    public void sendDailyDigests() {
        if (emailService == null) return;

        Instant since = Instant.now().minus(24, ChronoUnit.HOURS);
        List<Deal> recentDeals = dealRepository.findByDetectedAtAfterOrderByDetectedAtAsc(since);
        if (recentDeals.isEmpty()) return;

        for (User user : userRepository.findAll()) {
            preferenceRepository.findByUserId(user.getId()).ifPresent(prefs -> {
                if (prefs.getNotifyEmail() && prefs.getEmailFrequency() == EmailFrequency.DAILY_DIGEST) {
                    List<Deal> userDeals = recentDeals.stream()
                            .filter(d -> d.getTrackedSite().getUser().getId().equals(user.getId()))
                            .toList();
                    if (!userDeals.isEmpty()) {
                        emailService.sendDailyDigest(user, userDeals);
                    }
                }
            });
        }
    }

    @Transactional
    protected void processNewDeal(Deal deal) {
        User user = deal.getTrackedSite().getUser();
        UserPreference prefs = preferenceRepository.findByUserId(user.getId()).orElse(null);

        // In-app notification
        if (prefs == null || prefs.getNotifyInApp()) {
            notificationRepository.save(Notification.builder()
                    .user(user)
                    .deal(deal)
                    .channel(NotificationChannel.IN_APP)
                    .status(NotificationStatus.SENT)
                    .build());
        }

        // Instant email
        if (emailService != null && prefs != null
                && prefs.getNotifyEmail()
                && prefs.getEmailFrequency() == EmailFrequency.INSTANT) {
            emailService.sendDealAlert(user, deal);

            notificationRepository.save(Notification.builder()
                    .user(user)
                    .deal(deal)
                    .channel(NotificationChannel.EMAIL)
                    .status(NotificationStatus.SENT)
                    .build());
        }

        log.info("Dispatched notification for deal {} (site: {})",
                deal.getId(), deal.getTrackedSite().getName());
    }
}
