package com.elibrary.member;

import com.elibrary.common.ApiException;
import com.elibrary.issue.HoldRepository;
import com.elibrary.issue.Issue;
import com.elibrary.issue.IssueRepository;
import com.elibrary.security.AuthUser;
import com.elibrary.security.PasswordService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MemberController {
    private final MemberRepository members;
    private final IssueRepository issues;
    private final PasswordService passwords;
    private final HoldRepository holds;

    public MemberController(MemberRepository members, IssueRepository issues, PasswordService passwords, HoldRepository holds) {
        this.members = members;
        this.issues = issues;
        this.passwords = passwords;
        this.holds = holds;
    }

    // ---- admin ----

    @GetMapping("/api/admin/members")
    public List<Member> list() {
        return members.findAll();
    }

    @GetMapping("/api/admin/members/{id}")
    public Member get(@PathVariable String id) {
        return members.findById(id).orElseThrow(() -> ApiException.notFound("No member with ID " + id));
    }

    @PatchMapping("/api/admin/members/{id}/status")
    public Member updateStatus(@PathVariable String id, @Valid @RequestBody MemberRequests.UpdateStatus req) {
        get(id);
        members.updateStatus(id, req.status());
        return get(id);
    }

    @DeleteMapping("/api/admin/members/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        Member m = get(id);
        int open = issues.countByMember(id);
        if (open > 0) {
            throw ApiException.conflict(m.fullName() + " still has " + open + " book(s) issued. Collect them first.");
        }
        holds.deleteByMember(id);
        members.delete(id);
    }

    // ---- signed-in member ----

    @GetMapping("/api/me/profile")
    public Member profile(@AuthenticationPrincipal AuthUser user) {
        return get(user.id());
    }

    @PutMapping("/api/me/profile")
    public Member updateProfile(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody MemberRequests.UpdateProfile req) {
        Member current = get(user.id());
        Member updated = new Member(current.memberId(), req.fullName().trim(), req.dob(), req.contactNo().trim(), req.email().trim(),
                req.state(), req.city().trim(), req.pincode().trim(), req.fullAddress().trim(), current.accountStatus(), null);
        members.updateDetails(updated);
        return get(user.id());
    }

    @PutMapping("/api/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody MemberRequests.ChangePassword req) {
        Member current = get(user.id());
        if (!passwords.matches(req.currentPassword(), current.password())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        members.updatePassword(current.memberId(), passwords.encodeForStorage(req.newPassword()));
    }

    @GetMapping("/api/me/issues")
    public List<Issue> myIssues(@AuthenticationPrincipal AuthUser user) {
        return issues.findByMember(user.id());
    }
}
