package com.elibrary.issue;

import com.elibrary.book.Book;
import com.elibrary.book.BookRepository;
import com.elibrary.member.Member;
import com.elibrary.member.MemberRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/issues")
public class IssueController {
    private final LoanService loans;
    private final IssueRepository issues;
    private final HoldRepository holds;
    private final HistoryRepository history;
    private final BookRepository books;
    private final MemberRepository members;

    public IssueController(LoanService loans, IssueRepository issues, HoldRepository holds, HistoryRepository history,
                           BookRepository books, MemberRepository members) {
        this.loans = loans;
        this.issues = issues;
        this.holds = holds;
        this.history = history;
        this.books = books;
        this.members = members;
    }

    public record IssueRequest(@NotBlank(message = "Member ID is required") String memberId,
                               @NotBlank(message = "Book ID is required") String bookId,
                               String dueDate) {}

    public record LoanRequest(@NotBlank(message = "Member ID is required") String memberId,
                              @NotBlank(message = "Book ID is required") String bookId) {}

    /**
     * Live check for the issue form.
     * reserved: copies kept aside for other members' ready holds. holdStatus: this member's hold on this book, if any.
     */
    public record Lookup(String bookName, Integer available, Integer reserved, String memberName, String memberStatus,
                         boolean alreadyIssued, String holdStatus, int unpaidFines) {}

    @GetMapping
    public List<Issue> list() {
        return issues.findAll();
    }

    @GetMapping("/lookup")
    public Lookup lookup(@RequestParam(required = false) String bookId, @RequestParam(required = false) String memberId) {
        Book book = bookId == null || bookId.isBlank() ? null : books.findById(bookId.trim()).orElse(null);
        Member member = memberId == null || memberId.isBlank() ? null : members.findById(memberId.trim()).orElse(null);
        if (book != null) loans.refreshHolds(book.bookId());
        Optional<Hold> own = book != null && member != null ? holds.find(member.memberId(), book.bookId()) : Optional.empty();
        Integer reserved = book == null ? null
                : holds.countReady(book.bookId()) - (own.map(h -> "ready".equals(h.status())).orElse(false) ? 1 : 0);
        return new Lookup(
                book == null ? null : book.bookName(),
                book == null ? null : books.findById(book.bookId()).map(Book::currentStock).orElse(0),
                reserved,
                member == null ? null : member.fullName(),
                member == null ? null : member.accountStatus(),
                book != null && member != null && issues.exists(member.memberId(), book.bookId()),
                own.map(Hold::status).orElse(null),
                member == null ? 0 : history.unpaidTotal(member.memberId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Issue issue(@Valid @RequestBody IssueRequest req) {
        return loans.issue(req.memberId(), req.bookId(), req.dueDate());
    }

    @PostMapping("/return")
    public LoanService.ReturnResult returnBook(@Valid @RequestBody LoanRequest req) {
        return loans.returnBook(req.memberId(), req.bookId());
    }

    @PostMapping("/renew")
    public Issue renew(@Valid @RequestBody LoanRequest req) {
        return loans.renew(req.memberId(), req.bookId());
    }
}
