package com.lmuls.dealtracker;

import com.lmuls.dealtracker.config.HarvesterProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(HarvesterProperties.class)
public class HarvesterApplication {

    public static void main(String[] args) {
        SpringApplication.run(HarvesterApplication.class, args);
    }
}
