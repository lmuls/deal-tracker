package com.lmuls.dealtracker.detector;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.enums.DetectionLayer;
import com.lmuls.dealtracker.model.DealDetection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Layer 1 — extracts deal information from machine-readable structured data:
 * JSON-LD, Open Graph meta tags, and microdata (itemscope/itemprop).
 * All detections from this layer carry HIGH confidence.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class StructuredDataDetector implements DealDetector {

    private static final Set<String> OFFER_TYPES =
            Set.of("Offer", "AggregateOffer", "Sale", "Discount", "Event");

    private final ObjectMapper objectMapper;

    @Override
    public List<DealDetection> detect(Document htmlDoc, Locale locale) {
        List<DealDetection> results = new ArrayList<>();
        results.addAll(extractFromJsonLd(htmlDoc));
        results.addAll(extractFromOpenGraph(htmlDoc));
        results.addAll(extractFromMicrodata(htmlDoc));
        return results;
    }

    // ── JSON-LD ─────────────────────────────────────────────────────────────

    private List<DealDetection> extractFromJsonLd(Document doc) {
        List<DealDetection> results = new ArrayList<>();
        for (Element script : doc.select("script[type=application/ld+json]")) {
            try {
                JsonNode root = objectMapper.readTree(script.html());
                results.addAll(processJsonLdNode(root));
            } catch (Exception e) {
                log.debug("Skipping malformed JSON-LD block: {}", e.getMessage());
            }
        }
        return results;
    }

    private List<DealDetection> processJsonLdNode(JsonNode node) {
        if (node.isArray()) {
            List<DealDetection> results = new ArrayList<>();
            for (JsonNode item : node) results.addAll(processJsonLdNode(item));
            return results;
        }
        if (node.has("@graph")) return processJsonLdNode(node.get("@graph"));

        String type = node.path("@type").asText("");
        if (!OFFER_TYPES.contains(type)) {
            // Recurse into nested offers (e.g. Event with offers sub-object)
            JsonNode nested = node.path("offers");
            if (!nested.isMissingNode()) return processJsonLdNode(nested);
            return List.of();
        }

        String name = node.path("name").asText(null);
        String description = node.path("description").asText(null);
        String title = name != null ? name : (description != null ? description : type + " detected");
        if (title.length() > 120) title = title.substring(0, 120);

        String discount = node.path("discount").asText(null);
        if (discount == null) {
            JsonNode price = node.path("price");
            if (!price.isMissingNode() && !price.asText().isBlank()) discount = price.asText();
        }

        String expiryRaw = node.path("validThrough").asText(null);
        if (expiryRaw == null) expiryRaw = node.path("endDate").asText(null);
        Instant expiresAt = tryParseInstant(expiryRaw);

        DealType dealType = "Event".equals(type) ? DealType.SALE_EVENT : DealType.OTHER;

        return List.of(new DealDetection(
                dealType, title, description, discount,
                Confidence.HIGH, DetectionLayer.STRUCTURED_DATA, expiresAt));
    }

    // ── Open Graph ───────────────────────────────────────────────────────────

    private List<DealDetection> extractFromOpenGraph(Document doc) {
        String salePrice = metaContent(doc, "product:sale_price");
        String ogPrice = metaContent(doc, "og:price:amount");
        if (salePrice == null && ogPrice == null) return List.of();

        String discountValue = salePrice != null ? salePrice : ogPrice;
        String description = metaContent(doc, "og:description");
        String title = "Sale price: " + discountValue;

        return List.of(new DealDetection(
                DealType.OTHER, title, description, discountValue,
                Confidence.HIGH, DetectionLayer.STRUCTURED_DATA, null));
    }

    private static String metaContent(Document doc, String property) {
        Element el = doc.selectFirst("meta[property=" + property + "]");
        return (el != null && !el.attr("content").isBlank()) ? el.attr("content") : null;
    }

    // ── Microdata ────────────────────────────────────────────────────────────

    private List<DealDetection> extractFromMicrodata(Document doc) {
        List<DealDetection> results = new ArrayList<>();
        Elements offerEls = doc.select("[itemtype~=(?i)schema\\.org/(Offer|AggregateOffer)]");

        for (Element el : offerEls) {
            Element nameEl = el.selectFirst("[itemprop=name]");
            Element descEl = el.selectFirst("[itemprop=description]");
            Element priceEl = el.selectFirst("[itemprop=price]");

            if (nameEl == null && descEl == null && priceEl == null) continue;

            String name = nameEl != null ? nameEl.text() : null;
            String desc = descEl != null ? descEl.text() : null;
            String price = priceEl != null
                    ? (priceEl.attr("content").isBlank() ? priceEl.text() : priceEl.attr("content"))
                    : null;

            String title = name != null ? name : (desc != null ? desc : "Offer");
            if (title.length() > 120) title = title.substring(0, 120);

            results.add(new DealDetection(
                    DealType.SALE_EVENT, title, desc, price,
                    Confidence.HIGH, DetectionLayer.STRUCTURED_DATA, null));
        }
        return results;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Instant tryParseInstant(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Instant.parse(raw);
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
