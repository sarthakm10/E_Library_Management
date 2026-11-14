package com.elibrary.stats;

import com.elibrary.book.Book;
import com.elibrary.book.BookRepository;
import com.elibrary.issue.Issue;
import com.elibrary.issue.IssueRepository;
import com.elibrary.member.Member;
import com.elibrary.member.MemberRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
public class StatsController {
    private final BookRepository books;
    private final MemberRepository members;
    private final IssueRepository issues;

    public StatsController(BookRepository books, MemberRepository members, IssueRepository issues) {
        this.books = books;
        this.members = members;
        this.issues = issues;
    }

    public record PublicStats(int titles, int copies, int members, int genres) {}

    public record NameCount(String name, long count) {}

    public record Dashboard(
            int titles, int totalCopies, int availableCopies, int issuedCopies,
            int members, Map<String, Long> membersByStatus,
            int overdueCount, List<Issue> overdue, List<Issue> dueSoon,
            List<NameCount> genres, List<NameCount> topBorrowed, List<Member> pendingMembers) {}

    /** Small counts for the landing page. */
    @GetMapping("/api/stats")
    public PublicStats publicStats() {
        List<Book> all = books.findAll();
        int copies = all.stream().mapToInt(Book::actualStock).sum();
        long genres = all.stream().flatMap(b -> b.genres().stream()).distinct().count();
        return new PublicStats(all.size(), copies, members.count(), (int) genres);
    }

    @GetMapping("/api/admin/dashboard")
    public Dashboard dashboard() {
        List<Book> allBooks = books.findAll();
        List<Member> allMembers = members.findAll();
        List<Issue> allIssues = issues.findAll();

        int total = allBooks.stream().mapToInt(Book::actualStock).sum();
        int available = allBooks.stream().mapToInt(Book::currentStock).sum();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (String s : List.of("active", "pending", "deactive")) byStatus.put(s, 0L);
        allMembers.forEach(m -> byStatus.merge(m.accountStatus().isBlank() ? "pending" : m.accountStatus(), 1L, Long::sum));

        List<Issue> overdue = allIssues.stream().filter(Issue::overdue).toList();
        List<Issue> dueSoon = allIssues.stream()
                .filter(i -> i.daysLeft() != null && i.daysLeft() >= 0 && i.daysLeft() <= 3).toList();

        List<NameCount> genres = top(allBooks.stream().flatMap(b -> b.genres().stream()).toList(), Function.identity(), 8);
        List<NameCount> topBorrowed = top(allIssues, Issue::bookName, 5);
        List<Member> pending = allMembers.stream().filter(m -> "pending".equals(m.accountStatus())).limit(5).toList();

        return new Dashboard(allBooks.size(), total, available, total - available, allMembers.size(), byStatus,
                overdue.size(), overdue.stream().limit(8).toList(), dueSoon.stream().limit(8).toList(),
                genres, topBorrowed, pending);
    }

    private static <T> List<NameCount> top(List<T> items, Function<T, String> key, int limit) {
        return items.stream()
                .collect(Collectors.groupingBy(key, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .limit(limit)
                .map(e -> new NameCount(e.getKey(), e.getValue()))
                .toList();
    }
}
