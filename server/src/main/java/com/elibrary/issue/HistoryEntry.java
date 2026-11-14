package com.elibrary.issue;

/** A returned loan. fine is in rupees; finePaid only matters when fine > 0. */
public record HistoryEntry(
        long id,
        String memberId,
        String memberName,
        String bookId,
        String bookName,
        String issueDate,
        String dueDate,
        String returnDate,
        int renewCount,
        int daysLate,
        int fine,
        boolean finePaid) {
}
