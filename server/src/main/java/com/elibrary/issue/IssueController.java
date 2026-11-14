package com.elibrary.issue;

import com.elibrary.book.Book;
import com.elibrary.book.BookRepository;
import com.elibrary.common.ApiException;
import com.elibrary.config.AppProperties;
import com.elibrary.member.Member;
import com.elibrary.member.MemberRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/issues")
public class IssueController {
    private final IssueRepository issues;
    private final BookRepository books;
    private final MemberRepository members;
    private final AppProperties props;

    public IssueController(IssueRepository issues, BookRepository books, MemberRepository members, AppProperties props) {
        this.issues = issues;
        this.books = books;
        this.members = members;
        this.props = props;
    }

    public record IssueRequest(@NotBlank(message = "Member ID is required") String memberId,
                               @NotBlank(message = "Book ID is required") String bookId,
                               String dueDate) {}

    public record ReturnRequest(@NotBlank(message = "Member ID is required") String memberId,
                                @NotBlank(message = "Book ID is required") String bookId) {}

    /** Live lookup for the issue form: resolves names and tells the UI whether issuing is allowed. */
    public record Lookup(String bookName, Integer available, String memberName, String memberStatus, boolean alreadyIssued) {}

    @GetMapping
    public List<Issue> list() {
        return issues.findAll();
    }

    @GetMapping("/lookup")
    public Lookup lookup(@RequestParam(required = false) String bookId, @RequestParam(required = false) String memberId) {
        Book book = bookId == null || bookId.isBlank() ? null : books.findById(bookId.trim()).orElse(null);
        Member member = memberId == null || memberId.isBlank() ? null : members.findById(memberId.trim()).orElse(null);
        boolean already = book != null && member != null && issues.exists(member.memberId(), book.bookId());
        return new Lookup(
                book == null ? null : book.bookName(),
                book == null ? null : book.currentStock(),
                member == null ? null : member.fullName(),
                member == null ? null : member.accountStatus(),
                already);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Issue issue(@Valid @RequestBody IssueRequest req) {
        Book book = books.findById(req.bookId().trim()).orElseThrow(() -> ApiException.notFound("No book with ID " + req.bookId()));
        Member member = members.findById(req.memberId().trim()).orElseThrow(() -> ApiException.notFound("No member with ID " + req.memberId()));

        if (!"active".equals(member.accountStatus())) {
            throw ApiException.badRequest(member.fullName() + "'s account is " + member.accountStatus() + ". Activate it before issuing books.");
        }
        if (issues.exists(member.memberId(), book.bookId())) {
            throw ApiException.conflict(member.fullName() + " already has this book");
        }

        LocalDate today = LocalDate.now();
        LocalDate due = today.plusDays(props.defaultLoanDays());
        if (req.dueDate() != null && !req.dueDate().isBlank()) {
            try {
                due = LocalDate.parse(req.dueDate());
            } catch (Exception e) {
                throw ApiException.badRequest("Due date must be a valid date");
            }
            if (due.isBefore(today)) throw ApiException.badRequest("Due date can't be in the past");
        }

        // Decrement first: the WHERE current_stock > 0 guard makes this safe against two admins issuing the last copy.
        if (!books.decrementStock(book.bookId())) {
            throw ApiException.conflict("No copies of " + book.bookName() + " are available right now");
        }
        issues.insert(member.memberId(), member.fullName(), book.bookId(), book.bookName(), today.toString(), due.toString());

        return issues.findByMember(member.memberId()).stream()
                .filter(i -> i.bookId().equals(book.bookId())).findFirst().orElseThrow();
    }

    @PostMapping("/return")
    @Transactional
    public void returnBook(@Valid @RequestBody ReturnRequest req) {
        String memberId = req.memberId().trim();
        String bookId = req.bookId().trim();
        if (issues.delete(memberId, bookId) == 0) {
            throw ApiException.notFound("This member doesn't have that book issued");
        }
        books.incrementStock(bookId);
    }
}
