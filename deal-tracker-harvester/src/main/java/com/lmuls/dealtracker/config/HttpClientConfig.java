package com.lmuls.dealtracker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.http.HttpClient;

@Configuration
public class HttpClientConfig {

    @Bean
    public HttpClient httpClient(HarvesterProperties properties) {
        return HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(properties.getHttpTimeout())
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }
}
