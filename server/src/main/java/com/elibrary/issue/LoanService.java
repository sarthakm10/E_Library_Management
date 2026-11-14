package com.elibrary.issue;

import com.elibrary.book.Book;
import com.elibrary.book.BookRepository;
import com.elibrary.common.ApiException;
import com.elibrary.common.Values;
import com.elibrary.config.AppProperties;
import com.elibrary.member.Member;
import com.elibrary.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * The lending rules in one place: issue, return (with history and fines), renew, and the hold queue.
 *
 * Holds: a member can queue for a book with no free copies. When a copy comes back, the first waiting
 * member's hold turns "ready" and that copy is kept aside for them for holdPickupDays. Uncollected holds
 * expire and the next member moves up.
 */
@Service
public class LoanService {
    private static final int MAX_HOLDS_PER_MEMBER = 5;

    private final IssueRepository issues;
    private final HoldRepository holds;
    private final HistoryRepository history;
    private final BookRepository books;
    private final MemberRepository members;
    private final AppProperties props;

    public LoanService(IssueRepository issues, HoldRepository holds, HistoryRepository history,
                       BookRepository books, MemberRepository members, AppProperties props) {
        this.issues = issues;
        this.holds = holds;
        this.history = history;
        this.books = books;
        this.members = members;
        this.props = props;
    }

    public record ReturnResult(String bookName, String memberName, int daysLate, int fine, String holdReadyFor) {}

    // ---------- issue / return / renew ----------

    @Transactional
    public Issue issue(String memberId, String bookId, String dueDateText) {
        Book book = book(bookId);
        Member member = member(memberId);
        if (!"active".equals(member.accountStatus())) {
            throw ApiException.badRequest(member.fullName() + "'s account is " + member.accountStatus() + ". Activate it before issuing books.");
        }
        if (issues.exists(member.memberId(), book.bookId())) {
            throw ApiException.conflict(member.fullName() + " already has this book");
        }

        LocalDate today = LocalDate.now();
        LocalDate due = today.plusDays(props.defaultLoanDays());
        if (dueDateText != null && !dueDateText.isBlank()) {
            try {
                due = LocalDate.parse(dueDateText);
            } catch (Exception e) {
                throw ApiException.badRequest("Due date must be a valid date");
            }
            if (due.isBefore(today)) throw ApiException.badRequest("Due date can't be in the past");
        }

        refreshHolds(book.bookId());
        book = book(bookId);
        Optional<Hold> own = holds.find(member.memberId(), book.bookId());
        boolean ownReady = own.map(h -> "ready".equals(h.status())).orElse(false);
        int keptForOthers = holds.countReady(book.bookId()) - (ownReady ? 1 : 0);
        if (book.currentStock() - keptForOthers <= 0) {
            throw ApiException.conflict(book.currentStock() > 0
                    ? "The copies on the shelf are kept aside for members whose holds are ready"
                    : "No copies of " + book.bookName() + " are available right now");
        }

        // The WHERE current_stock > 0 guard makes this safe against two admins issuing the last copy.
        if (!books.decrementStock(book.bookId())) {
            throw ApiException.conflict("No copies of " + book.bookName() + " are available right now");
        }
        issues.insert(member.memberId(), member.fullName(), book.bookId(), book.bookName(), today.toString(), due.toString(), 0);
        own.ifPresent(h -> holds.delete(h.memberId(), h.bookId())); // their hold is fulfilled
        return issues.find(member.memberId(), book.bookId()).orElseThrow();
    }

    @Transactional
    public ReturnResult returnBook(String memberId, String bookId) {
        Issue loan = issues.find(memberId.trim(), bookId.trim())
                .orElseThrow(() -> ApiException.notFound("This member doesn't have that book issued"));
        issues.delete(loan.memberId(), loan.bookId());
        books.incrementStock(loan.bookId());

        LocalDate today = LocalDate.now();
        LocalDate due = Values.parseDate(loan.dueDate());
        int late = due == null ? 0 : (int) Math.max(0, ChronoUnit.DAYS.between(due, today));
        int fine = late * props.finePerDay();
        history.insert(loan.memberId(), loan.memberName(), loan.bookId(), loan.bookName(), loan.issueDate(), loan.dueDate(),
                today.toString(), loan.renewCount(), fine, false);

        List<Hold> nowReady = refreshHolds(loan.bookId());
        return new ReturnResult(loan.bookName(), loan.memberName(), late, fine,
                nowReady.isEmpty() ? null : nowReady.get(0).memberName());
    }

    @Transactional
    public Issue renew(String memberId, String bookId) {
        Issue loan = issues.find(memberId.trim(), bookId.trim())
                .orElseThrow(() -> ApiException.notFound("This member doesn't have that book issued"));
        if (loan.renewBlock() != null) throw ApiException.badRequest("Can't renew: " + loan.renewBlock());
        LocalDate newDue = Values.parseDate(loan.dueDate()).plusDays(props.defaultLoanDays());
        issues.renew(loan.memberId(), loan.bookId(), newDue.toString());
        return issues.find(loan.memberId(), loan.bookId()).orElseThrow();
    }

    // ---------- holds ----------

    @Transactional
    public Hold placeHold(String memberId, String bookId) {
        Member member = member(memberId);
        if (!"active".equals(member.accountStatus())) {
            throw ApiException.badRequest("Your membership needs to be active before you can place holds");
        }
        refreshHolds(bookId);
        Book book = book(bookId);
        if (issues.exists(member.memberId(), book.bookId())) throw ApiException.conflict("You already have this book");
        if (holds.find(member.memberId(), book.bookId()).isPresent()) throw ApiException.conflict("You already have a hold on this book");
        if (book.currentStock() - holds.countReady(book.bookId()) > 0) {
            throw ApiException.badRequest("A copy is on the shelf right now. Ask at the desk to borrow it.");
        }
        if (holds.countByMember(member.memberId()) >= MAX_HOLDS_PER_MEMBER) {
            throw ApiException.badRequest("You can have up to " + MAX_HOLDS_PER_MEMBER + " holds at a time");
        }
        holds.insert(member.memberId(), member.fullName(), book.bookId(), book.bookName(),
                LocalDateTime.now().withNano(0).toString(), "waiting", null);
        return holds.find(member.memberId(), book.bookId()).orElseThrow();
    }

    @Transactional
    public void cancelHold(String memberId, String bookId) {
        if (holds.delete(memberId, bookId) == 0) throw ApiException.notFound("No hold found");
        refreshHolds(bookId); // if it was ready, the next member gets the copy
    }

    /**
     * Expires uncollected ready holds and hands free copies to the next members in line.
     * Returns the holds that just became ready.
     */
    @Transactional
    public List<Hold> refreshHolds(String bookId) {
        Optional<Book> found = books.findById(bookId);
        if (found.isEmpty()) {
            holds.deleteByBook(bookId);
            return List.of();
        }
        LocalDate today = LocalDate.now();
        for (Hold h : holds.findByBook(bookId)) {
            LocalDate until = Values.parseDate(h.readyUntil());
            if ("ready".equals(h.status()) && until != null && until.isBefore(today)) holds.delete(h.memberId(), h.bookId());
        }
        int free = found.get().currentStock() - holds.countReady(bookId);
        List<Hold> promoted = new ArrayList<>();
        for (Hold h : holds.findByBook(bookId)) {
            if (free <= 0) break;
            if (!"waiting".equals(h.status())) continue;
            holds.markReady(h.memberId(), h.bookId(), today.plusDays(props.holdPickupDays()).toString());
            promoted.add(h);
            free--;
        }
        return promoted;
    }

    @Transactional
    public void refreshAllHolds() {
        holds.bookIds().forEach(this::refreshHolds);
    }

    private Book book(String bookId) {
        return books.findById(bookId.trim()).orElseThrow(() -> ApiException.notFound("No book with ID " + bookId));
    }

    private Member member(String memberId) {
        return members.findById(memberId.trim()).orElseThrow(() -> ApiException.notFound("No member with ID " + memberId));
    }
}
