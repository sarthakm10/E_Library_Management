package com.elibrary.book;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BookRequest(
        @NotBlank(message = "Book ID is required")
        @Pattern(regexp = "^[A-Za-z0-9_-]{1,30}$", message = "Book ID may only contain letters, numbers, _ or -")
        String bookId,
        @NotBlank(message = "Title is required") @Size(max = 300) String bookName,
        @NotEmpty(message = "Pick at least one genre") List<String> genres,
        @NotBlank(message = "Author is required") String authorName,
        @NotBlank(message = "Publisher is required") String publisherName,
        String publishDate,
        @NotBlank(message = "Language is required") String language,
        String edition,
        @Min(value = 0, message = "Cost can't be negative") int bookCost,
        @Min(value = 0, message = "Pages can't be negative") int pages,
        @Size(max = 2000) String description,
        @Min(value = 0, message = "Stock can't be negative") @Max(10000) int actualStock,
        /** Legacy-format link returned by the upload endpoint, e.g. "~/book_inventory/abc.jpg". Blank keeps the current image. */
        String imageLink) {
}
