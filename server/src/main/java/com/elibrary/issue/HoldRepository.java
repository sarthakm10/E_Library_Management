package com.elibrary.issue;

import com.elibrary.common.Values;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.elibrary.common.Values.str;

@Repository
public class HoldRepository {
    private static final String SELECT = """
            SELECT h.*, b.book_img_link FROM book_hold_tbl h
            LEFT JOIN book_master_tbl b ON b.book_id = h.book_id
            """;
    private static final String ORDER = " ORDER BY h.book_id, h.placed_at";
    private static final RowMapper<Hold> MAPPER = (rs, i) -> new Hold(
            str(rs, "member_id"), str(rs, "member_name"), str(rs, "book_id"), str(rs, "book_name"),
            Values.imageUrl(str(rs, "book_img_link")), str(rs, "placed_at"), str(rs, "status"), str(rs, "ready_until"), 0);

    private final NamedParameterJdbcTemplate jdbc;

    public HoldRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Hold> findAll() {
        return withPositions(jdbc.query(SELECT + ORDER, MAPPER));
    }

    /** Every hold on the book, in queue order (earliest first). */
    public List<Hold> findByBook(String bookId) {
        return withPositions(jdbc.query(SELECT + " WHERE h.book_id = :b" + ORDER, new MapSqlParameterSource("b", bookId), MAPPER));
    }

    public List<Hold> findByMember(String memberId) {
        // Positions depend on everyone else's holds, so compute them over the member's books in full.
        List<String> bookIds = jdbc.queryForList("SELECT book_id FROM book_hold_tbl WHERE member_id = :m",
                new MapSqlParameterSource("m", memberId), String.class);
        List<Hold> mine = new ArrayList<>();
        for (String bookId : bookIds) {
            findByBook(bookId).stream().filter(h -> h.memberId().equals(memberId)).forEach(mine::add);
        }
        return mine;
    }

    public Optional<Hold> find(String memberId, String bookId) {
        return findByBook(bookId).stream().filter(h -> h.memberId().equals(memberId)).findFirst();
    }

    public List<String> bookIds() {
        return jdbc.getJdbcTemplate().queryForList("SELECT DISTINCT book_id FROM book_hold_tbl", String.class);
    }

    public int countReady(String bookId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_hold_tbl WHERE book_id = :b AND status = 'ready'",
                new MapSqlParameterSource("b", bookId), Integer.class);
        return n == null ? 0 : n;
    }

    public int countByMember(String memberId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_hold_tbl WHERE member_id = :m",
                new MapSqlParameterSource("m", memberId), Integer.class);
        return n == null ? 0 : n;
    }

    public void insert(String memberId, String memberName, String bookId, String bookName, String placedAt, String status, String readyUntil) {
        jdbc.update("""
                INSERT INTO book_hold_tbl (member_id, member_name, book_id, book_name, placed_at, status, ready_until)
                VALUES (:m, :mn, :b, :bn, :placed, :status, :until)
                """, new MapSqlParameterSource("m", memberId).addValue("mn", memberName).addValue("b", bookId)
                .addValue("bn", bookName).addValue("placed", placedAt).addValue("status", status).addValue("until", readyUntil));
    }

    public void markReady(String memberId, String bookId, String readyUntil) {
        jdbc.update("UPDATE book_hold_tbl SET status = 'ready', ready_until = :until WHERE member_id = :m AND book_id = :b",
                new MapSqlParameterSource("until", readyUntil).addValue("m", memberId).addValue("b", bookId));
    }

    public int delete(String memberId, String bookId) {
        return jdbc.update("DELETE FROM book_hold_tbl WHERE member_id = :m AND book_id = :b",
                new MapSqlParameterSource("m", memberId).addValue("b", bookId));
    }

    public void deleteByBook(String bookId) {
        jdbc.update("DELETE FROM book_hold_tbl WHERE book_id = :b", new MapSqlParameterSource("b", bookId));
    }

    public void deleteByMember(String memberId) {
        jdbc.update("DELETE FROM book_hold_tbl WHERE member_id = :m", new MapSqlParameterSource("m", memberId));
    }

    /** Numbers waiting holds 1, 2, 3… per book, in the order they were placed. Ready holds get 0. */
    private static List<Hold> withPositions(List<Hold> holds) {
        Map<String, Integer> next = new HashMap<>();
        List<Hold> out = new ArrayList<>(holds.size());
        for (Hold h : holds) {
            int pos = 0;
            if ("waiting".equals(h.status())) pos = next.merge(h.bookId(), 1, Integer::sum);
            out.add(new Hold(h.memberId(), h.memberName(), h.bookId(), h.bookName(), h.imageUrl(), h.placedAt(), h.status(), h.readyUntil(), pos));
        }
        return out;
    }
}
