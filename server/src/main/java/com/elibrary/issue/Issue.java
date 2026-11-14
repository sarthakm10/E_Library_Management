package com.elibrary.issue;

/** A row of book_issue_tbl with computed due status. daysLeft is negative when overdue. */
public record Issue(
        String memberId,
        String memberName,
        String bookId,
        String bookName,
        String issueDate,
        String dueDate,
        Integer daysLeft,
        boolean overdue) {
}
