package com.elibrary.book;

import java.util.List;

/** A row of book_master_tbl, with genres split into a list and the image link turned into a URL. */
public record Book(
        String bookId,
        String bookName,
        List<String> genres,
        String authorName,
        String publisherName,
        String publishDate,
        String language,
        String edition,
        int bookCost,
        int pages,
        String description,
        int actualStock,
        int currentStock,
        String imageLink,
        String imageUrl) {

    public int issuedCount() {
        return Math.max(0, actualStock - currentStock);
    }
}
