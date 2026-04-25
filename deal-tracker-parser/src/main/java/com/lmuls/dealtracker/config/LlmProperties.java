package com.lmuls.dealtracker.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "parser.llm")
@Getter
@Setter
public class LlmProperties {

    /** Whether the LLM detection layer is active. Requires {@code api-key} to be set. */
    private boolean enabled = false;

    /** Anthropic API key. Typically supplied via the {@code ANTHROPIC_API_KEY} env var. */
    private String apiKey;

    /** Model ID to use for deal classification. */
    private String model = "claude-haiku-4-5-20251001";

    /** Maximum tokens the model may generate per request. */
    private int maxTokens = 600;

    /** Page text sent to the LLM is truncated to this many characters. */
    private int pageTextMaxChars = 4000;

    /** Base URL of the Anthropic API. */
    private String baseUrl = "https://api.anthropic.com";
}
