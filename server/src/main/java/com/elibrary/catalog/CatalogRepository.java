package com.elibrary.catalog;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.List;
import java.util.Optional;

import static com.elibrary.common.Values.str;

/**
 * Shared data access for author_master_tbl and publisher_master_tbl, which have the same shape.
 * Table and column names come from the fixed {@link Kind} enum, never from user input.
 */
public class CatalogRepository {
    public enum Kind {
        AUTHOR("author_master_tbl", "author_id", "author_name", "author_name"),
        PUBLISHER("publisher_master_tbl", "publisher_id", "publisher_name", "publisher_name");

        final String table, idCol, nameCol, bookCol;

        Kind(String table, String idCol, String nameCol, String bookCol) {
            this.table = table;
            this.idCol = idCol;
            this.nameCol = nameCol;
            this.bookCol = bookCol;
        }
    }

    private final NamedParameterJdbcTemplate jdbc;
    private final Kind kind;

    public CatalogRepository(NamedParameterJdbcTemplate jdbc, Kind kind) {
        this.jdbc = jdbc;
        this.kind = kind;
    }

    public List<CatalogEntry> findAll() {
        String sql = "SELECT t." + kind.idCol + " AS id, t." + kind.nameCol + " AS name, " +
                "(SELECT COUNT(*) FROM book_master_tbl b WHERE b." + kind.bookCol + " = t." + kind.nameCol + ") AS book_count " +
                "FROM " + kind.table + " t ORDER BY t." + kind.nameCol;
        return jdbc.query(sql, (rs, i) -> new CatalogEntry(str(rs, "id"), str(rs, "name"), rs.getInt("book_count")));
    }

    public Optional<CatalogEntry> findById(String id) {
        return findAll().stream().filter(e -> e.id().equalsIgnoreCase(id.trim())).findFirst();
    }

    public boolean nameTaken(String name, String exceptId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM " + kind.table + " WHERE " + kind.nameCol + " = :name AND " + kind.idCol + " <> :id",
                new MapSqlParameterSource("name", name).addValue("id", exceptId == null ? "" : exceptId), Integer.class);
        return n != null && n > 0;
    }

    public void insert(String id, String name) {
        jdbc.update("INSERT INTO " + kind.table + " (" + kind.idCol + ", " + kind.nameCol + ") VALUES (:id, :name)",
                new MapSqlParameterSource("id", id).addValue("name", name));
    }

    public void rename(String id, String name) {
        jdbc.update("UPDATE " + kind.table + " SET " + kind.nameCol + " = :name WHERE " + kind.idCol + " = :id",
                new MapSqlParameterSource("id", id).addValue("name", name));
    }

    public void delete(String id) {
        jdbc.update("DELETE FROM " + kind.table + " WHERE " + kind.idCol + " = :id", new MapSqlParameterSource("id", id));
    }
}
