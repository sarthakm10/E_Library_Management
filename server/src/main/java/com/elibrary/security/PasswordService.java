package com.elibrary.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

/**
 * Handles the move from plain-text passwords (legacy) to bcrypt hashes.
 * Hashes are only written when the password columns are wide enough (60+ chars); otherwise
 * the legacy plain-text behaviour is kept and a warning tells you to run db/sqlserver-upgrade.sql.
 */
@Service
public class PasswordService {
    private static final Logger log = LoggerFactory.getLogger(PasswordService.class);
    private static final int BCRYPT_LENGTH = 60;

    private final BCryptPasswordEncoder encoder;
    private final JdbcTemplate jdbc;
    private volatile boolean hashingEnabled = false;

    public PasswordService(BCryptPasswordEncoder encoder, JdbcTemplate jdbc) {
        this.encoder = encoder;
        this.jdbc = jdbc;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkColumnWidths() {
        try {
            List<Integer> widths = jdbc.queryForList(
                    "SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE LOWER(COLUMN_NAME) = 'password' AND LOWER(TABLE_NAME) IN ('member_master_tbl', 'admin_login_tbl')",
                    Integer.class);
            // -1 means NVARCHAR(MAX)
            // >= 2: MySQL's INFORMATION_SCHEMA can also list same-named tables from other databases.
            hashingEnabled = widths.size() >= 2 && widths.stream().allMatch(w -> w != null && (w == -1 || w >= BCRYPT_LENGTH));
        } catch (Exception e) {
            hashingEnabled = false;
        }
        if (hashingEnabled) {
            log.info("Password columns support bcrypt: passwords will be hashed.");
        } else {
            log.warn("Password columns are too narrow for bcrypt hashes, so passwords stay in plain text. " +
                     "Run server/db/sqlserver-upgrade.sql against elibraryDB to enable hashing.");
        }
    }

    public boolean isHash(String stored) {
        return stored != null && stored.length() == BCRYPT_LENGTH && stored.matches("^\\$2[aby]\\$.*");
    }

    public boolean matches(String raw, String stored) {
        if (raw == null || stored == null) return false;
        if (isHash(stored)) return encoder.matches(raw, stored);
        return MessageDigest.isEqual(raw.getBytes(StandardCharsets.UTF_8), stored.getBytes(StandardCharsets.UTF_8));
    }

    /** True when a successful login should replace the stored plain-text password with a hash. */
    public boolean needsUpgrade(String stored) {
        return hashingEnabled && !isHash(stored);
    }

    /** Value to store for a new password: a hash if the schema allows it, otherwise the raw value. */
    public String encodeForStorage(String raw) {
        return hashingEnabled ? encoder.encode(raw) : raw;
    }
}
