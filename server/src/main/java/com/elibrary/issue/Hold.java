package com.elibrary.issue;

/**
 * A member's place in the queue for a book.
 * status is "waiting" or "ready"; a ready hold has a copy kept aside until readyUntil.
 * position is the place in line among waiting holds (1 = next), or 0 when ready.
 */
public record Hold(
        String memberId,
        String memberName,
        String bookId,
        String bookName,
        String imageUrl,
        String placedAt,
        String status,
        String readyUntil,
        int position) {
}
