package com.elibrary.catalog;

import com.elibrary.book.BookRepository;
import com.elibrary.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Authors and publishers. Lists are public (used for catalog filters); changes are admin-only. */
@RestController
public class CatalogController {
    private final CatalogRepository authors;
    private final CatalogRepository publishers;
    private final BookRepository books;

    public CatalogController(NamedParameterJdbcTemplate jdbc, BookRepository books) {
        this.authors = new CatalogRepository(jdbc, CatalogRepository.Kind.AUTHOR);
        this.publishers = new CatalogRepository(jdbc, CatalogRepository.Kind.PUBLISHER);
        this.books = books;
    }

    public record EntryRequest(
            @NotBlank(message = "ID is required")
            @Pattern(regexp = "^[A-Za-z0-9_-]{1,30}$", message = "ID may only contain letters, numbers, _ or -") String id,
            @NotBlank(message = "Name is required") @Size(max = 200) String name) {}

    // ---- authors ----

    @GetMapping("/api/authors")
    public List<CatalogEntry> listAuthors() {
        return authors.findAll();
    }

    @PostMapping("/api/admin/authors")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogEntry createAuthor(@Valid @RequestBody EntryRequest req) {
        return create(authors, req, "author");
    }

    @PutMapping("/api/admin/authors/{id}")
    @Transactional
    public CatalogEntry renameAuthor(@PathVariable String id, @Valid @RequestBody EntryRequest req) {
        CatalogEntry old = find(authors, id, "author");
        CatalogEntry updated = rename(authors, old, req, "author");
        books.renameAuthor(old.name(), updated.name());
        return find(authors, id, "author");
    }

    @DeleteMapping("/api/admin/authors/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAuthor(@PathVariable String id) {
        CatalogEntry entry = find(authors, id, "author");
        int used = books.countByAuthor(entry.name());
        if (used > 0) throw ApiException.conflict(entry.name() + " has " + used + " book(s). Reassign or delete them first.");
        authors.delete(entry.id());
    }

    // ---- publishers ----

    @GetMapping("/api/publishers")
    public List<CatalogEntry> listPublishers() {
        return publishers.findAll();
    }

    @PostMapping("/api/admin/publishers")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogEntry createPublisher(@Valid @RequestBody EntryRequest req) {
        return create(publishers, req, "publisher");
    }

    @PutMapping("/api/admin/publishers/{id}")
    @Transactional
    public CatalogEntry renamePublisher(@PathVariable String id, @Valid @RequestBody EntryRequest req) {
        CatalogEntry old = find(publishers, id, "publisher");
        CatalogEntry updated = rename(publishers, old, req, "publisher");
        books.renamePublisher(old.name(), updated.name());
        return find(publishers, id, "publisher");
    }

    @DeleteMapping("/api/admin/publishers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePublisher(@PathVariable String id) {
        CatalogEntry entry = find(publishers, id, "publisher");
        int used = books.countByPublisher(entry.name());
        if (used > 0) throw ApiException.conflict(entry.name() + " has " + used + " book(s). Reassign or delete them first.");
        publishers.delete(entry.id());
    }

    // ---- shared ----

    private static CatalogEntry find(CatalogRepository repo, String id, String label) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("No " + label + " with ID " + id));
    }

    private static CatalogEntry create(CatalogRepository repo, EntryRequest req, String label) {
        String id = req.id().trim();
        String name = req.name().trim();
        if (repo.findById(id).isPresent()) throw ApiException.conflict("An " + label + " with ID " + id + " already exists");
        if (repo.nameTaken(name, null)) throw ApiException.conflict("An " + label + " named " + name + " already exists");
        repo.insert(id, name);
        return find(repo, id, label);
    }

    private static CatalogEntry rename(CatalogRepository repo, CatalogEntry old, EntryRequest req, String label) {
        String name = req.name().trim();
        if (repo.nameTaken(name, old.id())) throw ApiException.conflict("An " + label + " named " + name + " already exists");
        repo.rename(old.id(), name);
        return new CatalogEntry(old.id(), name, old.bookCount());
    }
}
