package com.elibrary;

import com.elibrary.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

// JWT auth replaces Spring's default in-memory user, so skip creating it.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
public class ElibraryApplication {
    public static void main(String[] args) {
        SpringApplication.run(ElibraryApplication.class, args);
    }
}
