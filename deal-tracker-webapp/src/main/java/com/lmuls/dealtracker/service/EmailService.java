package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;
import java.util.Locale;

/**
 * Sends transactional emails using JavaMailSender + Thymeleaf templates.
 * Only activated when a {@link JavaMailSender} bean is present
 * (i.e. {@code spring.mail.host} is configured).
 */
@Service
@ConditionalOnBean(JavaMailSender.class)
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public void sendDealAlert(User user, Deal deal) {
        try {
            Context ctx = new Context(Locale.ENGLISH);
            ctx.setVariable("deal", deal);
            ctx.setVariable("siteName", deal.getTrackedSite().getName());
            ctx.setVariable("siteUrl", deal.getTrackedSite().getUrl());
            String html = templateEngine.process("deal-alert", ctx);

            var msg = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject("New deal detected: " + deal.getTitle());
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("Deal alert sent to {} for deal {}", user.getEmail(), deal.getId());
        } catch (Exception e) {
            log.error("Failed to send deal alert to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    public void sendDailyDigest(User user, List<Deal> deals) {
        if (deals.isEmpty()) return;
        try {
            Context ctx = new Context(Locale.ENGLISH);
            ctx.setVariable("deals", deals);
            ctx.setVariable("userEmail", user.getEmail());
            String html = templateEngine.process("daily-digest", ctx);

            var msg = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject("Your daily deals digest — " + deals.size() + " new deal(s)");
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("Daily digest sent to {} ({} deals)", user.getEmail(), deals.size());
        } catch (Exception e) {
            log.error("Failed to send daily digest to {}: {}", user.getEmail(), e.getMessage());
        }
    }
}
