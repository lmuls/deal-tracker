package com.lmuls.dealtracker.entity;

import com.lmuls.dealtracker.enums.EmailFrequency;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreference {

    @Id
    private UUID userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "notify_email", nullable = false)
    @Builder.Default
    private Boolean notifyEmail = true;

    @Column(name = "notify_in_app", nullable = false)
    @Builder.Default
    private Boolean notifyInApp = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_frequency", nullable = false)
    @Builder.Default
    private EmailFrequency emailFrequency = EmailFrequency.INSTANT;
}
