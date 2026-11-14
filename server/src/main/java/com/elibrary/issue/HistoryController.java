package com.elibrary.issue;

import com.elibrary.common.ApiException;
import com.elibrary.security.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Borrowing history and fines. */
@RestController
public class HistoryController {
    private final HistoryRepository history;

    public HistoryController(HistoryRepository history) {
        this.history = history;
    }

    public record PaidRequest(boolean paid) {}

    @GetMapping("/api/admin/history")
    public List<HistoryEntry> all() {
        return history.findAll();
    }

    /** Mark a fine paid (or undo that). */
    @PatchMapping("/api/admin/history/{id}/paid")
    public void setPaid(@PathVariable long id, @RequestBody PaidRequest req) {
        if (history.setPaid(id, req.paid()) == 0) throw ApiException.notFound("No fine found for that loan");
    }

    @GetMapping("/api/me/history")
    public List<HistoryEntry> mine(@AuthenticationPrincipal AuthUser user) {
        return history.findByMember(user.id());
    }
}
