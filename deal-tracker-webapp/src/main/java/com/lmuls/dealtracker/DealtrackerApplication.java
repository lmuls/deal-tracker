package com.lmuls.dealtracker;

import com.lmuls.dealtracker.config.WebAppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(WebAppProperties.class)
public class DealtrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DealtrackerApplication.class, args);
    }
}
