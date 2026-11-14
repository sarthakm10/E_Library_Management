package com.elibrary.issue;

/**
 * An open loan (a row of book_issue_tbl) with its due status worked out.
 * daysLeft is negative when overdue; fine is what would be owed if it came back today;
 * renewBlock explains why the loan can't be renewed, or is null when it can.
 */
public record Issue(
        String memberId,
        String memberName,
        String bookId,
        String bookName,
        String issueDate,
        String dueDate,
        Integer daysLeft,
        boolean overdue,
        int renewCount,
        int fine,
        String renewBlock) {
}
