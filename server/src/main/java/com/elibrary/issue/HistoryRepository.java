package com.elibrary.issue;

import com.elibrary.common.Values;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static com.elibrary.common.Values.date;
import static com.elibrary.common.Values.intOf;
import static com.elibrary.common.Values.str;

@Repository
public class HistoryRepository {
    private static final String ORDER = " ORDER BY return_date DESC, history_id DESC";
    private static final RowMapper<HistoryEntry> MAPPER = (rs, i) -> {
        String due = date(rs, "due_date");
        String returned = date(rs, "return_date");
        LocalDate d = Values.parseDate(due);
        LocalDate r = Values.parseDate(returned);
        int late = d == null || r == null ? 0 : (int) Math.max(0, ChronoUnit.DAYS.between(d, r));
        return new HistoryEntry(rs.getLong("history_id"), str(rs, "member_id"), str(rs, "member_name"), str(rs, "book_id"),
                str(rs, "book_name"), date(rs, "issue_date"), due, returned, intOf(rs, "renew_count"), late,
                intOf(rs, "fine_amount"), intOf(rs, "fine_paid") == 1);
    };

    private final NamedParameterJdbcTemplate jdbc;

    public HistoryRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<HistoryEntry> findAll() {
        return jdbc.query("SELECT * FROM loan_history_tbl" + ORDER, MAPPER);
    }

    public List<HistoryEntry> findByMember(String memberId) {
        return jdbc.query("SELECT * FROM loan_history_tbl WHERE member_id = :m" + ORDER, new MapSqlParameterSource("m", memberId), MAPPER);
    }

    public void insert(String memberId, String memberName, String bookId, String bookName, String issueDate, String dueDate,
                       String returnDate, int renewCount, int fine, boolean finePaid) {
        jdbc.update("""
                INSERT INTO loan_history_tbl (member_id, member_name, book_id, book_name, issue_date, due_date, return_date,
                                              renew_count, fine_amount, fine_paid)
                VALUES (:m, :mn, :b, :bn, :issued, :due, :returned, :renewals, :fine, :paid)
                """, new MapSqlParameterSource("m", memberId).addValue("mn", memberName).addValue("b", bookId)
                .addValue("bn", bookName).addValue("issued", issueDate).addValue("due", dueDate).addValue("returned", returnDate)
                .addValue("renewals", renewCount).addValue("fine", fine).addValue("paid", finePaid ? 1 : 0));
    }

    public int setPaid(long id, boolean paid) {
        return jdbc.update("UPDATE loan_history_tbl SET fine_paid = :paid WHERE history_id = :id AND fine_amount > 0",
                new MapSqlParameterSource("paid", paid ? 1 : 0).addValue("id", id));
    }

    /** Total of fines the member hasn't paid yet. */
    public int unpaidTotal(String memberId) {
        Integer n = jdbc.queryForObject(
                "SELECT COALESCE(SUM(fine_amount), 0) FROM loan_history_tbl WHERE member_id = :m AND fine_amount > 0 AND fine_paid = 0",
                new MapSqlParameterSource("m", memberId), Integer.class);
        return n == null ? 0 : n;
    }
}
