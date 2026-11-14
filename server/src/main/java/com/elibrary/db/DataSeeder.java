package com.elibrary.db;

import com.elibrary.book.Book;
import com.elibrary.book.BookRepository;
import com.elibrary.config.AppProperties;
import com.elibrary.issue.HistoryRepository;
import com.elibrary.issue.HoldRepository;
import com.elibrary.issue.IssueRepository;
import com.elibrary.member.Member;
import com.elibrary.member.MemberRepository;
import com.elibrary.security.PasswordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Fills an empty database so every screen has something to show:
 *  1. the 300-book catalog (db/seed/catalog.sql), when books, authors and publishers are all empty;
 *  2. sample members with loans, borrowing history, fines and holds, when there are no members yet.
 * Each step runs at most once per database. Turn it off with APP_SEED_SAMPLE_DATA=false.
 * The sample logins are listed in DEMO_ACCOUNTS.md at the repository root.
 */
@Component
@Order(10)
public class DataSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    /** Password for every sample member. */
    public static final String SAMPLE_PASSWORD = "reader123";
    private static final List<String> SAMPLE_IDS = List.of("aarav01", "diya02", "kabir03", "meera04", "rohan05", "sana06");

    private final JdbcTemplate jdbc;
    private final DataSource dataSource;
    private final TransactionTemplate tx;
    private final BookRepository books;
    private final MemberRepository members;
    private final IssueRepository issues;
    private final HistoryRepository history;
    private final HoldRepository holds;
    private final PasswordService passwords;
    private final AppProperties props;

    public DataSeeder(JdbcTemplate jdbc, DataSource dataSource, TransactionTemplate tx, BookRepository books,
                      MemberRepository members, IssueRepository issues, HistoryRepository history, HoldRepository holds,
                      PasswordService passwords, AppProperties props) {
        this.jdbc = jdbc;
        this.dataSource = dataSource;
        this.tx = tx;
        this.books = books;
        this.members = members;
        this.issues = issues;
        this.history = history;
        this.holds = holds;
        this.passwords = passwords;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!props.seedSampleData()) return;
        seedCatalog();
        seedMembers();
    }

    private void seedCatalog() {
        if (count("book_master_tbl") + count("author_master_tbl") + count("publisher_master_tbl") > 0) return;
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("db/seed/catalog.sql"));
        populator.setSqlScriptEncoding("UTF-8");
        populator.execute(dataSource);
        log.info("Seeded the catalog: {} books", count("book_master_tbl"));
    }

    private void seedMembers() {
        // Only into a library with no lending activity yet, and never over existing accounts.
        // Members who signed up themselves are fine and are left as they are.
        if (count("book_issue_tbl") + count("loan_history_tbl") + count("book_hold_tbl") > 0) return;
        if (SAMPLE_IDS.stream().anyMatch(members::exists)) return;
        passwords.checkColumnWidths(); // so the sample passwords are stored as bcrypt hashes where the schema allows
        tx.executeWithoutResult(status -> {
            String pw = passwords.encodeForStorage(SAMPLE_PASSWORD);
            member("aarav01", "Aarav Mehta", "1999-03-14", "9820012345", "aarav@example.com", "Maharashtra", "Mumbai", "400050", "21 Carter Road, Bandra West", "active", pw);
            member("diya02", "Diya Patel", "2001-08-22", "9825098765", "diya@example.com", "Gujarat", "Ahmedabad", "380009", "5 CG Road, Navrangpura", "active", pw);
            member("kabir03", "Kabir Singh", "1997-11-02", "9815054321", "kabir@example.com", "Punjab", "Ludhiana", "141001", "88 Ferozepur Road", "active", pw);
            member("meera04", "Meera Nair", "2000-01-30", "9847011223", "meera@example.com", "Kerala", "Kochi", "682016", "14 MG Road, Ernakulam", "active", pw);
            member("rohan05", "Rohan Gupta", "2002-06-18", "9839022334", "rohan@example.com", "Uttar Pradesh", "Lucknow", "226001", "3 Hazratganj", "pending", pw);
            member("sana06", "Sana Khan", "1998-09-09", "9849033445", "sana@example.com", "Telangana", "Hyderabad", "500034", "9 Road No. 12, Banjara Hills", "deactive", pw);
            seedLoans();
        });
        log.info("Seeded 6 sample members (password '{}'), with loans, history and holds", SAMPLE_PASSWORD);
    }

    /** Loans, history and holds dated relative to today, so there's always something overdue, due soon and ready. */
    private void seedLoans() {
        List<Book> all = new ArrayList<>(books.findAll());
        all.sort(Comparator.comparing(Book::bookId));
        // Prefer well-known titles when they exist (they do in the bundled catalog); fall back to anything with stock.
        List<Book> plenty = pick(all.stream().filter(b -> b.currentStock() >= 3).toList(), List.of(
                "Harry Potter and the Prisoner of Azkaban", "Atomic Habits", "Dune", "The Hobbit", "Sapiens",
                "The Alchemist", "Nineteen Eighty-Four", "Pride and Prejudice", "The Kite Runner", "Wings of Fire",
                "The Silent Patient", "Ikigai"));
        List<Book> single = all.stream().filter(b -> b.actualStock() == 1 && b.currentStock() == 1).toList();
        if (plenty.size() < 12 || single.size() < 2) {
            log.info("Not enough books in stock for sample loans; created members only");
            return;
        }

        // Open loans: (member, book, issued N days ago, due in N days, renewals)
        loan("aarav01", "Aarav Mehta", plenty.get(0), -20, -6, 0);   // 6 days overdue → fine accruing
        loan("aarav01", "Aarav Mehta", plenty.get(1), -26, 2, 1);    // renewed once, due in 2 days
        loan("diya02", "Diya Patel", plenty.get(2), -5, 9, 0);
        loan("diya02", "Diya Patel", plenty.get(3), -15, -1, 0);     // 1 day overdue
        loan("kabir03", "Kabir Singh", single.get(0), -4, 10, 0);    // only copy → others queue for it
        loan("meera04", "Meera Nair", plenty.get(4), -9, 5, 0);

        // Returned loans (member, book, issued, due, returned, renewals, fine paid?)
        returned("aarav01", "Aarav Mehta", plenty.get(5), -60, -46, -40, 0, false);  // 6 days late, ₹ unpaid
        returned("aarav01", "Aarav Mehta", plenty.get(6), -45, -31, -33, 0, false);
        returned("diya02", "Diya Patel", plenty.get(7), -50, -36, -36, 0, false);
        returned("diya02", "Diya Patel", plenty.get(8), -54, -26, -23, 1, true);     // renewed, 3 days late, paid
        returned("kabir03", "Kabir Singh", plenty.get(0), -35, -21, -22, 0, false);
        returned("kabir03", "Kabir Singh", single.get(1), -25, -11, -1, 0, false);   // 10 days late, unpaid
        returned("meera04", "Meera Nair", plenty.get(9), -30, -16, -18, 0, false);
        returned("meera04", "Meera Nair", plenty.get(10), -70, -56, -55, 0, true);   // 1 day late, paid

        // Holds: two members queue for Kabir's single copy; Meera's hold on the copy Kabir just returned is ready.
        hold("diya02", "Diya Patel", single.get(0), -2, "waiting", null);
        hold("aarav01", "Aarav Mehta", single.get(0), -1, "waiting", null);
        hold("meera04", "Meera Nair", single.get(1), -3, "ready", day(props.holdPickupDays() - 1));
    }

    private void member(String id, String name, String dob, String phone, String email, String state, String city,
                        String pincode, String address, String status, String password) {
        members.insert(new Member(id, name, dob, phone, email, state, city, pincode, address, status, null), password);
    }

    private void loan(String memberId, String memberName, Book book, int issuedDaysAgo, int dueInDays, int renewals) {
        books.decrementStock(book.bookId());
        issues.insert(memberId, memberName, book.bookId(), book.bookName(), day(issuedDaysAgo), day(dueInDays), renewals);
    }

    private void returned(String memberId, String memberName, Book book, int issued, int due, int ret, int renewals, boolean paid) {
        int late = Math.max(0, ret - due);
        history.insert(memberId, memberName, book.bookId(), book.bookName(), day(issued), day(due), day(ret),
                renewals, late * props.finePerDay(), paid);
    }

    private void hold(String memberId, String memberName, Book book, int placedDaysAgo, String status, String readyUntil) {
        String placedAt = LocalDate.now().plusDays(placedDaysAgo).atTime(10, 0).toString();
        holds.insert(memberId, memberName, book.bookId(), book.bookName(), placedAt, status, readyUntil);
    }

    private static String day(int offset) {
        return LocalDate.now().plusDays(offset).toString();
    }

    private static List<Book> pick(List<Book> pool, List<String> preferred) {
        List<Book> out = new ArrayList<>();
        for (String title : preferred) pool.stream().filter(b -> b.bookName().equals(title)).findFirst().ifPresent(out::add);
        pool.stream().filter(b -> !out.contains(b)).forEach(out::add);
        return out;
    }

    private int count(String table) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
        return n == null ? 0 : n;
    }
}
