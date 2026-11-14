package com.elibrary.book;

import com.elibrary.common.Values;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static com.elibrary.common.Values.date;
import static com.elibrary.common.Values.intOf;
import static com.elibrary.common.Values.str;

@Repository
public class BookRepository {
    private static final RowMapper<Book> MAPPER = (rs, i) -> {
        String link = str(rs, "book_img_link");
        List<String> genres = Arrays.stream(str(rs, "genre").split(","))
                .map(String::trim).filter(g -> !g.isEmpty()).toList();
        return new Book(
                str(rs, "book_id"), str(rs, "book_name"), genres, str(rs, "author_name"), str(rs, "publisher_name"),
                date(rs, "publish_date"), str(rs, "language"), str(rs, "edition"), intOf(rs, "book_cost"),
                intOf(rs, "no_of_pages"), str(rs, "book_description"), intOf(rs, "actual_stock"), intOf(rs, "current_stock"),
                link, Values.imageUrl(link), intOf(rs, "holds_ready"), intOf(rs, "holds_waiting"));
    };
    private static final String SELECT = """
            SELECT b.*,
                   (SELECT COUNT(*) FROM book_hold_tbl h WHERE h.book_id = b.book_id AND h.status = 'ready') AS holds_ready,
                   (SELECT COUNT(*) FROM book_hold_tbl h WHERE h.book_id = b.book_id AND h.status = 'waiting') AS holds_waiting
            FROM book_master_tbl b
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public BookRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Book> findAll() {
        return jdbc.query(SELECT + " ORDER BY b.book_name", MAPPER);
    }

    public Optional<Book> findById(String bookId) {
        return jdbc.query(SELECT + " WHERE b.book_id = :id", new MapSqlParameterSource("id", bookId), MAPPER)
                .stream().findFirst();
    }

    public boolean existsByIdOrName(String bookId, String bookName) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_master_tbl WHERE book_id = :id OR book_name = :name",
                new MapSqlParameterSource("id", bookId).addValue("name", bookName), Integer.class);
        return n != null && n > 0;
    }

    public boolean nameTakenByOther(String bookId, String bookName) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_master_tbl WHERE book_name = :name AND book_id <> :id",
                new MapSqlParameterSource("id", bookId).addValue("name", bookName), Integer.class);
        return n != null && n > 0;
    }

    public void insert(BookRequest b, String imageLink) {
        jdbc.update("""
                INSERT INTO book_master_tbl (book_id, book_name, genre, author_name, publisher_name, publish_date, language, edition,
                                             book_cost, no_of_pages, book_description, actual_stock, current_stock, book_img_link)
                VALUES (:bookId, :bookName, :genre, :authorName, :publisherName, :publishDate, :language, :edition,
                        :bookCost, :pages, :description, :actualStock, :currentStock, :imageLink)
                """, params(b).addValue("currentStock", b.actualStock()).addValue("imageLink", imageLink));
    }

    public void update(BookRequest b, int currentStock, String imageLink) {
        jdbc.update("""
                UPDATE book_master_tbl SET book_name = :bookName, genre = :genre, author_name = :authorName,
                       publisher_name = :publisherName, publish_date = :publishDate, language = :language, edition = :edition,
                       book_cost = :bookCost, no_of_pages = :pages, book_description = :description,
                       actual_stock = :actualStock, current_stock = :currentStock, book_img_link = :imageLink
                WHERE book_id = :bookId
                """, params(b).addValue("currentStock", currentStock).addValue("imageLink", imageLink));
    }

    public int delete(String bookId) {
        return jdbc.update("DELETE FROM book_master_tbl WHERE book_id = :id", new MapSqlParameterSource("id", bookId));
    }

    /** Takes one copy off the shelf; returns false when none are left. */
    public boolean decrementStock(String bookId) {
        return jdbc.update("UPDATE book_master_tbl SET current_stock = current_stock - 1 WHERE book_id = :id AND current_stock > 0",
                new MapSqlParameterSource("id", bookId)) > 0;
    }

    public void incrementStock(String bookId) {
        jdbc.update("UPDATE book_master_tbl SET current_stock = current_stock + 1 WHERE book_id = :id",
                new MapSqlParameterSource("id", bookId));
    }

    public int countByAuthor(String authorName) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_master_tbl WHERE author_name = :n",
                new MapSqlParameterSource("n", authorName), Integer.class);
        return n == null ? 0 : n;
    }

    public int countByPublisher(String publisherName) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM book_master_tbl WHERE publisher_name = :n",
                new MapSqlParameterSource("n", publisherName), Integer.class);
        return n == null ? 0 : n;
    }

    public void renameAuthor(String oldName, String newName) {
        jdbc.update("UPDATE book_master_tbl SET author_name = :newName WHERE author_name = :oldName",
                new MapSqlParameterSource("newName", newName).addValue("oldName", oldName));
    }

    public void renamePublisher(String oldName, String newName) {
        jdbc.update("UPDATE book_master_tbl SET publisher_name = :newName WHERE publisher_name = :oldName",
                new MapSqlParameterSource("newName", newName).addValue("oldName", oldName));
    }

    private static MapSqlParameterSource params(BookRequest b) {
        return new MapSqlParameterSource()
                .addValue("bookId", b.bookId().trim())
                .addValue("bookName", b.bookName().trim())
                .addValue("genre", String.join(",", b.genres()))
                .addValue("authorName", b.authorName())
                .addValue("publisherName", b.publisherName())
                .addValue("publishDate", b.publishDate() == null ? "" : b.publishDate())
                .addValue("language", b.language())
                .addValue("edition", b.edition() == null ? "" : b.edition().trim())
                .addValue("bookCost", b.bookCost())
                .addValue("pages", b.pages())
                .addValue("description", b.description() == null ? "" : b.description().trim())
                .addValue("actualStock", b.actualStock());
    }
}
