# LLM-Based Deal Categorization

## Context

The parser currently uses a 3-layer rule-based pipeline (structured data, DOM patterns, text keywords) to detect deals. This document describes an optional 4th detection layer that calls an external LLM at runtime to classify whether page content contains a genuine offer. This improves accuracy on pages where heuristic rules produce false positives or miss deals entirely.

The LLM acts as a peer detector alongside the existing layers — it receives extracted page text, returns structured deal detections, and the existing deduplication logic handles overlap with other layers.

---

## Architecture

The new `LlmDetector` implements the existing `DealDetector` interface and is auto-registered by Spring into the `List<DealDetector>` that `ParseService` already iterates. No changes needed in `ParseService`.

```
ParseService.parse()
  └─ for each DealDetector:
       ├─ StructuredDataDetector (Layer 1, HIGH confidence)
       ├─ DomPatternDetector     (Layer 2, MEDIUM confidence)
       ├─ TextPatternDetector    (Layer 3, LOW→MEDIUM confidence)
       └─ LlmDetector           (Layer 4, HIGH confidence)  ← NEW
```

---

## Files to Create

### 1. `deal-tracker-parser/src/main/java/com/lmuls/dealtracker/config/LlmProperties.java`
`@ConfigurationProperties(prefix = "parser.llm")` with fields:
- `boolean enabled` (default `false`)
- `String apiKey`
- `String model` (e.g., `claude-haiku-4-5-20251001`)
- `int maxTokens` (default `600`)
- `int pageTextMaxChars` (default `4000`)
- `String baseUrl` (default `https://api.anthropic.com`)

### 2. `deal-tracker-parser/src/main/java/com/lmuls/dealtracker/detector/LlmDetector.java`
Implements `DealDetector`. Annotated `@ConditionalOnProperty(name = "parser.llm.enabled", havingValue = "true")` so it's only registered when enabled.

Logic:
1. `doc.body().text()` — extract visible text via Jsoup (already on classpath)
2. Truncate to `pageTextMaxChars`
3. Build Anthropic Messages API request as JSON (using `ObjectMapper` already on classpath)
4. Call `https://api.anthropic.com/v1/messages` via Java `HttpClient` (built-in, no new deps)
5. Parse JSON response — extract the assistant message text, then parse it as a JSON array
6. Map each item → `DealDetection` with `DetectionLayer.LLM` and `Confidence.HIGH`
7. On any exception (network, JSON parse, etc.): log warn, return `List.of()`

**Prompt template** (sent as user message):
```
You are a deal detection assistant. Analyze the following webpage text and identify all promotional offers, discounts, sales, or deals. Return ONLY a valid JSON array (no explanation). If no deals are found, return [].

Each item in the array must have these fields:
- "type": one of PERCENTAGE_OFF, COUPON, SALE_EVENT, FREE_SHIPPING, BOGO, OTHER
- "title": short deal title (max 100 chars)
- "description": optional longer description or null
- "discountValue": discount amount/percentage string or null

Webpage text:
{text}
```

### 3. `deal-tracker-parser/src/main/java/com/lmuls/dealtracker/config/LlmConfig.java`
`@Configuration` class that:
- Creates `ObjectMapper` bean named `llmObjectMapper` for JSON serialization/deserialization in `LlmDetector`
- Creates `java.net.http.HttpClient` bean named `llmHttpClient`
- Annotated `@ConditionalOnProperty(name = "parser.llm.enabled", havingValue = "true")`

---

## Files to Modify

### 4. `deal-tracker-common/src/main/java/com/lmuls/dealtracker/enums/DetectionLayer.java`
Add `LLM` value. No DB migration needed — `detection_layer` column is `VARCHAR NOT NULL`, confirmed in `V5__create_deals.sql`.

### 5. `deal-tracker-parser/src/main/resources/application.yaml`
Add LLM config section:
```yaml
parser:
  llm:
    enabled: false                  # opt-in, requires api-key to be set
    api-key: ${ANTHROPIC_API_KEY:}
    model: claude-haiku-4-5-20251001
    max-tokens: 600
    page-text-max-chars: 4000
    base-url: https://api.anthropic.com
```

### 6. No new Maven dependencies required
Java `HttpClient` is built-in (Java 11+, project uses Java 21). Jackson (`jackson-databind`) is already on the classpath.

---

## Key Reused Components

| Component | Location |
|---|---|
| `DealDetector` interface | `deal-tracker-parser/.../detector/DealDetector.java` |
| `DealDetection` record | `deal-tracker-parser/.../model/DealDetection.java` |
| `DetectionLayer` enum | `deal-tracker-common/.../enums/DetectionLayer.java` |
| `DealType` enum | `deal-tracker-common/.../enums/DealType.java` |
| `Confidence` enum | `deal-tracker-common/.../enums/Confidence.java` |
| `ParseService` deduplication | no change needed; LLM detections merge automatically |

---

## Verification

1. **Unit test** — `LlmDetectorTest.java` using a mock `HttpClient`: verify correct prompt construction, JSON response parsing, and empty-list fallback on error.
2. **Integration test** — Set `parser.llm.enabled=true` with a real API key in test env and run against a known deal page.
3. **Manual** — Set `ANTHROPIC_API_KEY` env var, set `parser.llm.enabled=true` in local `application.yaml`, run the parser, and check that deals with `detection_layer = 'LLM'` appear in the `deals` table.
4. **Disabled path** — Without setting `parser.llm.enabled=true`, verify the parser starts normally and `LlmDetector` bean is not registered.
