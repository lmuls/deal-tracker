package com.lmuls.dealtracker.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
@ConditionalOnProperty(name = "parser.llm.enabled", havingValue = "true")
public class LlmConfig {

    @Bean(name = "llmHttpClient")
    public HttpClient llmHttpClient() {
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Bean(name = "llmObjectMapper")
    public ObjectMapper llmObjectMapper() {
        return new ObjectMapper();
    }
}
