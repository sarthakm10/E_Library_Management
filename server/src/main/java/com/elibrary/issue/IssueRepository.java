package com.elibrary.issue;

import com.elibrary.common.Values;
import com.elibrary.config.AppProperties;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static com.elibrary.common.Values.date;
import static com.elibrary.common.Values.intOf;
import static com.elibrary.common.Values.str;

@Repository
public class IssueRepository {
    // Counts other members queued for the same book, which blocks renewing it.
    private static final String SELECT = """
            SELECT i.*, (SELECT COUNT(*) FROM book_hold_tbl h WHERE h.book_id = i.book_id AND h.status = 'waiting') AS holds_waiting
            FROM book_issue_tbl i
            """;
    /** Overdue first, then soonest due. */
    private static final Comparator<Issue> BY_URGENCY = Comparator.comparing(
            (Issue x) -> x.daysLeft() == null ? Integer.MAX_VALUE : x.daysLeft());

    private final NamedParameterJdbcTemplate jdbc;
    private final RowMapper<Issue> mapper;

    public IssueRepository(NamedParameterJdbcTemplate jdbc, AppProperties props) {
        this.jdbc = jdbc;
        this.mapper = (rs, i) -> {
            String due = date(rs, "due_date");
            LocalDate dueDate = Values.parseDate(due);
            Integer daysLeft = dueDate == null ? null : (int) ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
            boolean overdue = daysLeft != null && daysLeft < 0;
            int renewals = intOf(rs, "renew_count");
            int waiting = intOf(rs, "holds_waiting");
            String block = dueDate == null ? "This loan has no due date"
                    : overdue ? "It's overdue. Return it (and settle the fine) instead."
                    : renewals >= props.maxRenewals() ? "Already renewed " + renewals + " time" + (renewals == 1 ? "" : "s") + ", the limit"
                    : waiting > 0 ? "Another member is waiting for this book"
                    : null;
            return new Issue(str(rs, "member_id"), str(rs, "member_name"), str(rs, "book_id"), str(rs, "book_name"),
                    date(rs, "issue_date"), due, daysLeft, overdue, renewals,
                    overdue ? -daysLeft * props.finePerDay() : 0, block);
        };
    }

    public List<Issue> findAll() {
        return jdbc.query(SELECT, mapper).stream().sorted(BY_URGENCY).toList();
    }

    public List<Issue> findByMember(String memberId) {
        return jdbc.query(SELECT + " WHERE i.member_id = :id", new MapSqlParameterSource("id", memberId), mapper)
                .stream().sorted(BY_URGENCY).toList();
    }

    public Optional<Issue> find(String memberId, String bookId) {
        return jdbc.query(SELECT + " WHERE i.member_id = :m AND i.book_id = :b",
                new MapSqlParameterSource("m", memberId).addValue("b", bookId), mapper).stream().findFirst();
    }

    public boolean exists(String memberId, String bookId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_issue_tbl WHERE member_id = :m AND book_id = :b",
                new MapSqlParameterSource("m", memberId).addValue("b", bookId), Integer.class);
        return n != null && n > 0;
    }

    public int countByBook(String bookId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_issue_tbl WHERE book_id = :b",
                new MapSqlParameterSource("b", bookId), Integer.class);
        return n == null ? 0 : n;
    }

    public int countByMember(String memberId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_issue_tbl WHERE member_id = :m",
                new MapSqlParameterSource("m", memberId), Integer.class);
        return n == null ? 0 : n;
    }

    public void insert(String memberId, String memberName, String bookId, String bookName, String issueDate, String dueDate, int renewCount) {
        jdbc.update("""
                INSERT INTO book_issue_tbl (member_id, member_name, book_id, book_name, issue_date, due_date, renew_count)
                VALUES (:memberId, :memberName, :bookId, :bookName, :issueDate, :dueDate, :renewCount)
                """, new MapSqlParameterSource()
                .addValue("memberId", memberId).addValue("memberName", memberName)
                .addValue("bookId", bookId).addValue("bookName", bookName)
                .addValue("issueDate", issueDate).addValue("dueDate", dueDate).addValue("renewCount", renewCount));
    }

    /** Moves the due date and counts the renewal. */
    public int renew(String memberId, String bookId, String newDueDate) {
        return jdbc.update("""
                UPDATE book_issue_tbl SET due_date = :due, renew_count = renew_count + 1
                WHERE member_id = :m AND book_id = :b
                """, new MapSqlParameterSource("due", newDueDate).addValue("m", memberId).addValue("b", bookId));
    }

    public int delete(String memberId, String bookId) {
        return jdbc.update("DELETE FROM book_issue_tbl WHERE member_id = :m AND book_id = :b",
                new MapSqlParameterSource("m", memberId).addValue("b", bookId));
    }
}
