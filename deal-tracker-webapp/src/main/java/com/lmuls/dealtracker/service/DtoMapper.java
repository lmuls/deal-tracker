package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.api.model.*;
import com.lmuls.dealtracker.entity.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Stateless helper that maps JPA entities to generated OpenAPI DTO classes.
 */
final class DtoMapper {

    private DtoMapper() {}

    static SiteResponse toSiteResponse(TrackedSite site, long activeDealsCount) {
        return new SiteResponse()
                .id(site.getId())
                .url(site.getUrl())
                .name(site.getName())
                .checkInterval(site.getCheckInterval())
                .active(site.getActive())
                .lastCheckedAt(toOffset(site.getLastCheckedAt() != null
                        ? site.getLastCheckedAt().atOffset(ZoneOffset.UTC) : null))
                .activeDealsCount((int) activeDealsCount)
                .hasActiveDeal(activeDealsCount > 0);
    }

    static SiteDetailResponse toSiteDetailResponse(TrackedSite site, List<Deal> activeDeals) {
        return new SiteDetailResponse()
                .id(site.getId())
                .url(site.getUrl())
                .name(site.getName())
                .checkInterval(site.getCheckInterval())
                .active(site.getActive())
                .lastCheckedAt(toOffset(site.getLastCheckedAt() != null
                        ? site.getLastCheckedAt().atOffset(ZoneOffset.UTC) : null))
                .activeDealsCount(activeDeals.size())
                .hasActiveDeal(!activeDeals.isEmpty())
                .activeDeals(activeDeals.stream().map(DtoMapper::toDealResponse).toList());
    }

    static DealResponse toDealResponse(Deal deal) {
        return new DealResponse()
                .id(deal.getId())
                .siteId(deal.getTrackedSite().getId())
                .siteName(deal.getTrackedSite().getName())
                .type(DealType.valueOf(deal.getType().name()))
                .title(deal.getTitle())
                .description(deal.getDescription())
                .discountValue(deal.getDiscountValue())
                .confidence(Confidence.valueOf(deal.getConfidence().name()))
                .detectionLayer(DetectionLayer.valueOf(deal.getDetectionLayer().name()))
                .detectedAt(deal.getDetectedAt().atOffset(ZoneOffset.UTC))
                .expiresAt(deal.getExpiresAt() != null
                        ? deal.getExpiresAt().atOffset(ZoneOffset.UTC) : null)
                .active(deal.getActive());
    }

    static NotificationResponse toNotificationResponse(Notification n) {
        return new NotificationResponse()
                .id(n.getId())
                .deal(toDealResponse(n.getDeal()))
                .channel(NotificationChannel.valueOf(n.getChannel().name()))
                .status(NotificationStatus.valueOf(n.getStatus().name()))
                .createdAt(n.getCreatedAt().atOffset(ZoneOffset.UTC));
    }

    static PreferencesResponse toPreferencesResponse(UserPreference prefs) {
        return new PreferencesResponse()
                .notifyEmail(prefs.getNotifyEmail())
                .notifyInApp(prefs.getNotifyInApp())
                .emailFrequency(EmailFrequency.valueOf(prefs.getEmailFrequency().name()));
    }

    private static OffsetDateTime toOffset(OffsetDateTime odt) {
        return odt;
    }
}
