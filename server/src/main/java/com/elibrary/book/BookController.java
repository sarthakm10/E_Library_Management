package com.elibrary.book;

import com.elibrary.common.ApiException;
import com.elibrary.issue.IssueRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.regex.Pattern;

@RestController
public class BookController {
    private static final String DEFAULT_IMAGE = "~/book_inventory/books1.png";
    private static final Pattern SAFE_LINK = Pattern.compile("^~/book_inventory/[A-Za-z0-9._-]+$");

    private final BookRepository books;
    private final IssueRepository issues;

    public BookController(BookRepository books, IssueRepository issues) {
        this.books = books;
        this.issues = issues;
    }

    // ---- public ----

    @GetMapping("/api/books")
    public List<Book> list() {
        return books.findAll();
    }

    @GetMapping("/api/books/{id}")
    public Book get(@PathVariable String id) {
        return books.findById(id).orElseThrow(() -> ApiException.notFound("No book with ID " + id));
    }

    // ---- admin ----

    @PostMapping("/api/admin/books")
    @ResponseStatus(HttpStatus.CREATED)
    public Book create(@Valid @RequestBody BookRequest req) {
        if (books.existsByIdOrName(req.bookId().trim(), req.bookName().trim())) {
            throw ApiException.conflict("A book with that ID or title already exists");
        }
        String link = isSafeLink(req.imageLink()) ? req.imageLink() : DEFAULT_IMAGE;
        books.insert(req, link);
        return get(req.bookId().trim());
    }

    @PutMapping("/api/admin/books/{id}")
    @Transactional
    public Book update(@PathVariable String id, @Valid @RequestBody BookRequest req) {
        if (!id.equals(req.bookId().trim())) {
            throw ApiException.badRequest("Book ID can't be changed");
        }
        Book existing = get(id);
        if (books.nameTakenByOther(id, req.bookName().trim())) {
            throw ApiException.conflict("Another book already has that title");
        }
        int issued = existing.issuedCount();
        if (req.actualStock() < issued) {
            throw ApiException.badRequest("Total stock can't be less than the " + issued + " copies currently issued");
        }
        String link = isSafeLink(req.imageLink()) ? req.imageLink() : existing.imageLink();
        books.update(req, req.actualStock() - issued, link);
        return get(id);
    }

    @DeleteMapping("/api/admin/books/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        get(id);
        int open = issues.countByBook(id);
        if (open > 0) {
            throw ApiException.conflict("This book has " + open + " copies issued. Collect them before deleting it.");
        }
        books.delete(id);
    }

    private static boolean isSafeLink(String link) {
        return link != null && SAFE_LINK.matcher(link).matches();
    }
}
