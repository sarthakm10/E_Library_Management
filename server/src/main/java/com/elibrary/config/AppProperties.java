package com.elibrary.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Jwt jwt,
        String uploadDir,
        List<String> corsOrigins,
        int defaultLoanDays,
        /* Rupees charged per day a book is returned late. */
        int finePerDay,
        /* How many times one loan can be renewed. */
        int maxRenewals,
        /* Days a member has to collect a book once their hold is ready. */
        int holdPickupDays,
        /* Load the 300-book catalog and sample members on an empty database. */
        boolean seedSampleData) {
    public record Jwt(String secret, int ttlHours) {}
}
