package com.elibrary.auth;

import com.elibrary.common.ApiException;
import com.elibrary.member.Member;
import com.elibrary.member.MemberRepository;
import com.elibrary.member.MemberRequests;
import com.elibrary.security.AuthUser;
import com.elibrary.security.JwtService;
import com.elibrary.security.PasswordService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static com.elibrary.common.Values.str;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final MemberRepository members;
    private final NamedParameterJdbcTemplate jdbc;
    private final PasswordService passwords;
    private final JwtService jwt;

    public AuthController(MemberRepository members, NamedParameterJdbcTemplate jdbc, PasswordService passwords, JwtService jwt) {
        this.members = members;
        this.jdbc = jdbc;
        this.passwords = passwords;
        this.jwt = jwt;
    }

    public record LoginRequest(@NotBlank(message = "Enter your ID") String id,
                               @NotBlank(message = "Enter your password") String password) {}

    public record SessionUser(String id, String name, String role, String status) {}

    public record LoginResponse(String token, SessionUser user) {}

    @PostMapping("/login")
    public LoginResponse memberLogin(@Valid @RequestBody LoginRequest req) {
        Member m = members.findById(req.id().trim())
                .filter(found -> passwords.matches(req.password(), found.password()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid member ID or password"));

        if ("deactive".equals(m.accountStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Your account has been deactivated. Please contact the library.");
        }
        if (passwords.needsUpgrade(m.password())) {
            try {
                members.updatePassword(m.memberId(), passwords.encodeForStorage(req.password()));
            } catch (Exception e) {
                log.warn("Could not upgrade password hash for member {}: {}", m.memberId(), e.getMessage());
            }
        }
        AuthUser user = new AuthUser(m.memberId(), m.fullName(), "user");
        return new LoginResponse(jwt.issue(user), new SessionUser(user.id(), user.name(), "user", m.accountStatus()));
    }

    @PostMapping("/admin/login")
    public LoginResponse adminLogin(@Valid @RequestBody LoginRequest req) {
        var params = new MapSqlParameterSource("u", req.id().trim());
        // Read by position like the legacy code did: username, password, full name.
        var rows = jdbc.query("SELECT * FROM admin_login_tbl WHERE username = :u", params,
                (rs, i) -> new String[]{str(rs, "username"), str(rs, "password"),
                        rs.getMetaData().getColumnCount() >= 3 && rs.getString(3) != null ? rs.getString(3).trim() : ""});
        String[] admin = rows.stream()
                .filter(r -> passwords.matches(req.password(), r[1]))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid admin username or password"));

        if (passwords.needsUpgrade(admin[1])) {
            try {
                jdbc.update("UPDATE admin_login_tbl SET password = :p WHERE username = :u",
                        new MapSqlParameterSource("p", passwords.encodeForStorage(req.password())).addValue("u", admin[0]));
            } catch (Exception e) {
                log.warn("Could not upgrade admin password hash: {}", e.getMessage());
            }
        }
        String name = admin[2].isBlank() ? "Admin" : admin[2];
        AuthUser user = new AuthUser(admin[0], name, "admin");
        return new LoginResponse(jwt.issue(user), new SessionUser(user.id(), name, "admin", "active"));
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> signup(@Valid @RequestBody MemberRequests.Signup req) {
        String id = req.memberId().trim();
        if (members.exists(id)) {
            throw ApiException.conflict("That member ID is taken. Try another one.");
        }
        Member m = new Member(id, req.fullName().trim(), req.dob(), req.contactNo().trim(), req.email().trim(),
                req.state(), req.city().trim(), req.pincode().trim(), req.fullAddress().trim(), "pending", null);
        members.insert(m, passwords.encodeForStorage(req.password()));
        return Map.of("message", "Account created. You can sign in now; an admin will activate your membership.");
    }

    /** Returns the current user with fresh status, so the UI can restore a session. */
    @GetMapping("/me")
    public SessionUser me(@AuthenticationPrincipal AuthUser user) {
        if (user.isAdmin()) {
            return new SessionUser(user.id(), user.name(), "admin", "active");
        }
        Member m = members.findById(user.id()).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
        if ("deactive".equals(m.accountStatus())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Your account has been deactivated");
        }
        return new SessionUser(m.memberId(), m.fullName(), "user", m.accountStatus());
    }
}
