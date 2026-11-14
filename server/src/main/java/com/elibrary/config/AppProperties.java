package com.elibrary.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, String uploadDir, List<String> corsOrigins, int defaultLoanDays) {
    public record Jwt(String secret, int ttlHours) {}
}
