package com.lmuls.dealtracker.detector;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lmuls.dealtracker.config.LlmProperties;
import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.enums.DetectionLayer;
import com.lmuls.dealtracker.model.DealDetection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Detection layer 4 — uses an external LLM (Anthropic Claude) to identify
 * deals from extracted page text. Only active when {@code parser.llm.enabled=true}.
 *
 * <p>Failures (network errors, malformed JSON, API errors) are caught and logged;
 * the method always returns an empty list rather than propagating exceptions so
 * the overall parse pipeline is unaffected.
 */
@Component
@ConditionalOnProperty(name = "parser.llm.enabled", havingValue = "true")
@Slf4j
@RequiredArgsConstructor
public class LlmDetector implements DealDetector {

    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final String MESSAGES_PATH = "/v1/messages";

    private static final String PROMPT_TEMPLATE = """
            You are a deal detection assistant. Analyze the following webpage text and identify all \
            promotional offers, discounts, sales, or deals. Return ONLY a valid JSON array (no explanation \
            or markdown). If no deals are found, return [].

            Each item in the array must have exactly these fields:
            - "type": one of PERCENTAGE_OFF, COUPON, SALE_EVENT, FREE_SHIPPING, BOGO, OTHER
            - "title": short deal title (max 100 chars)
            - "description": optional longer description, or null
            - "discountValue": discount amount or percentage string (e.g. "20%", "$10 off"), or null

            Webpage text:
            %s
            """;

    private final LlmProperties properties;

    @Qualifier("llmHttpClient")
    private final HttpClient httpClient;

    @Qualifier("llmObjectMapper")
    private final ObjectMapper objectMapper;

    @Override
    public List<DealDetection> detect(Document htmlDoc, Locale locale) {
        String pageText = extractText(htmlDoc);
        if (pageText.isBlank()) {
            return List.of();
        }

        try {
            String responseText = callLlm(pageText);
            return parseDetections(responseText);
        } catch (Exception e) {
            log.warn("LLM detection failed: {}", e.getMessage());
            return List.of();
        }
    }

    private String extractText(Document doc) {
        String text = doc.body() != null ? doc.body().text() : "";
        if (text.length() > properties.getPageTextMaxChars()) {
            text = text.substring(0, properties.getPageTextMaxChars());
        }
        return text;
    }

    private String callLlm(String pageText) throws Exception {
        String prompt = PROMPT_TEMPLATE.formatted(pageText);

        Map<String, Object> requestBody = Map.of(
                "model", properties.getModel(),
                "max_tokens", properties.getMaxTokens(),
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        String requestJson = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(properties.getBaseUrl() + MESSAGES_PATH))
                .header("Content-Type", "application/json")
                .header("x-api-key", properties.getApiKey())
                .header("anthropic-version", ANTHROPIC_VERSION)
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("Anthropic API returned HTTP {}: {}", response.statusCode(), response.body());
            return "[]";
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.path("content").path(0).path("text").asText("[]");
    }

    private List<DealDetection> parseDetections(String json) {
        // Strip markdown code fences the model may add despite instructions
        String cleaned = json.strip();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceAll("(?s)^```[a-z]*\\n?", "").replaceAll("```$", "").strip();
        }

        JsonNode array;
        try {
            array = objectMapper.readTree(cleaned);
        } catch (Exception e) {
            log.warn("LLM response is not valid JSON: {}", cleaned);
            return List.of();
        }

        if (!array.isArray()) {
            log.warn("LLM response is not a JSON array");
            return List.of();
        }

        List<DealDetection> detections = new ArrayList<>();
        for (JsonNode item : array) {
            DealDetection detection = toDetection(item);
            if (detection != null) {
                detections.add(detection);
            }
        }
        return detections;
    }

    private DealDetection toDetection(JsonNode item) {
        String title = item.path("title").asText(null);
        if (title == null || title.isBlank()) {
            return null;
        }

        DealType type = parseDealType(item.path("type").asText("OTHER"));
        String description = item.path("description").isNull() ? null : item.path("description").asText(null);
        String discountValue = item.path("discountValue").isNull() ? null : item.path("discountValue").asText(null);

        return new DealDetection(type, title, description, discountValue, Confidence.HIGH, DetectionLayer.LLM, null);
    }

    private static DealType parseDealType(String raw) {
        try {
            return DealType.valueOf(raw.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return DealType.OTHER;
        }
    }
}
