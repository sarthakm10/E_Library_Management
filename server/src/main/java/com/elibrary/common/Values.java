package com.elibrary.common;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Helpers for reading the legacy tables. The old app stored most values as (possibly fixed-width) text,
 * so everything is read as a trimmed string and parsed in Java.
 */
public final class Values {
    private static final Pattern ISO_PREFIX = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}.*");
    private static final List<DateTimeFormatter> FALLBACK_FORMATS = List.of(
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("M/d/yyyy"),
            DateTimeFormatter.ofPattern("d-M-yyyy"));

    private Values() {}

    public static String str(ResultSet rs, String column) throws SQLException {
        String value = rs.getString(column);
        return value == null ? "" : value.trim();
    }

    public static int intOf(ResultSet rs, String column) throws SQLException {
        return parseInt(str(rs, column));
    }

    public static int parseInt(String value) {
        if (value == null || value.isBlank()) return 0;
        try {
            return (int) Math.round(Double.parseDouble(value.trim()));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /** Normalises a stored date to yyyy-MM-dd where possible; returns the raw text otherwise. */
    public static String date(ResultSet rs, String column) throws SQLException {
        return normalizeDate(str(rs, column));
    }

    public static String normalizeDate(String raw) {
        if (raw == null || raw.isBlank()) return "";
        String value = raw.trim();
        if (ISO_PREFIX.matcher(value).matches()) return value.substring(0, 10);
        String datePart = value.split(" ")[0];
        for (DateTimeFormatter f : FALLBACK_FORMATS) {
            try {
                return LocalDate.parse(datePart, f).toString();
            } catch (DateTimeParseException ignored) {
                // try the next format
            }
        }
        return value;
    }

    public static LocalDate parseDate(String normalized) {
        try {
            return LocalDate.parse(normalized);
        } catch (Exception e) {
            return null;
        }
    }

    /** Converts the legacy "~/book_inventory/x.jpg" link into a browser path. */
    public static String imageUrl(String link) {
        if (link == null || link.isBlank()) return "/book_inventory/books1.png";
        String path = link.trim().replace('\\', '/');
        if (path.startsWith("~")) path = path.substring(1);
        if (!path.startsWith("/")) path = "/" + path;
        return path;
    }
}
