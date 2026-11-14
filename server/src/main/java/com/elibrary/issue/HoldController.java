package com.elibrary.issue;

import com.elibrary.security.AuthUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Holds (reservations) for admins and for the signed-in member, plus member self-renewal. */
@RestController
public class HoldController {
    private final LoanService loans;
    private final HoldRepository holds;

    public HoldController(LoanService loans, HoldRepository holds) {
        this.loans = loans;
        this.holds = holds;
    }

    public record HoldRequest(@NotBlank(message = "Book ID is required") String bookId) {}

    // ---- admin ----

    @GetMapping("/api/admin/holds")
    public List<Hold> all() {
        loans.refreshAllHolds();
        return holds.findAll();
    }

    @DeleteMapping("/api/admin/holds/{memberId}/{bookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable String memberId, @PathVariable String bookId) {
        loans.cancelHold(memberId, bookId);
    }

    // ---- signed-in member ----

    @GetMapping("/api/me/holds")
    public List<Hold> mine(@AuthenticationPrincipal AuthUser user) {
        holds.findByMember(user.id()).forEach(h -> loans.refreshHolds(h.bookId()));
        return holds.findByMember(user.id());
    }

    @PostMapping("/api/me/holds")
    @ResponseStatus(HttpStatus.CREATED)
    public Hold place(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody HoldRequest req) {
        return loans.placeHold(user.id(), req.bookId());
    }

    @DeleteMapping("/api/me/holds/{bookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelMine(@AuthenticationPrincipal AuthUser user, @PathVariable String bookId) {
        loans.cancelHold(user.id(), bookId);
    }

    @PostMapping("/api/me/issues/{bookId}/renew")
    public Issue renewMine(@AuthenticationPrincipal AuthUser user, @PathVariable String bookId) {
        return loans.renew(user.id(), bookId);
    }
}
