package com.elibrary.issue;

import com.elibrary.common.Values;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

import static com.elibrary.common.Values.date;
import static com.elibrary.common.Values.str;

@Repository
public class IssueRepository {
    private static final RowMapper<Issue> MAPPER = (rs, i) -> {
        String due = date(rs, "due_date");
        LocalDate dueDate = Values.parseDate(due);
        Integer daysLeft = dueDate == null ? null : (int) ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
        return new Issue(str(rs, "member_id"), str(rs, "member_name"), str(rs, "book_id"), str(rs, "book_name"),
                date(rs, "issue_date"), due, daysLeft, daysLeft != null && daysLeft < 0);
    };
    /** Overdue first, then soonest due. */
    private static final Comparator<Issue> BY_URGENCY = Comparator.comparing(
            (Issue x) -> x.daysLeft() == null ? Integer.MAX_VALUE : x.daysLeft());

    private final NamedParameterJdbcTemplate jdbc;

    public IssueRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Issue> findAll() {
        return jdbc.query("SELECT * FROM book_issue_tbl", MAPPER).stream().sorted(BY_URGENCY).toList();
    }

    public List<Issue> findByMember(String memberId) {
        return jdbc.query("SELECT * FROM book_issue_tbl WHERE member_id = :id", new MapSqlParameterSource("id", memberId), MAPPER)
                .stream().sorted(BY_URGENCY).toList();
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

    public void insert(String memberId, String memberName, String bookId, String bookName, String issueDate, String dueDate) {
        jdbc.update("""
                INSERT INTO book_issue_tbl (member_id, member_name, book_id, book_name, issue_date, due_date)
                VALUES (:memberId, :memberName, :bookId, :bookName, :issueDate, :dueDate)
                """, new MapSqlParameterSource()
                .addValue("memberId", memberId).addValue("memberName", memberName)
                .addValue("bookId", bookId).addValue("bookName", bookName)
                .addValue("issueDate", issueDate).addValue("dueDate", dueDate));
    }

    public int delete(String memberId, String bookId) {
        return jdbc.update("DELETE FROM book_issue_tbl WHERE member_id = :m AND book_id = :b",
                new MapSqlParameterSource("m", memberId).addValue("b", bookId));
    }
}
