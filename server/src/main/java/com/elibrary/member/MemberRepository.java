package com.elibrary.member;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.elibrary.common.Values.date;
import static com.elibrary.common.Values.str;

@Repository
public class MemberRepository {
    private static final RowMapper<Member> MAPPER = (rs, i) -> new Member(
            str(rs, "member_id"), str(rs, "full_name"), date(rs, "dob"), str(rs, "contact_no"), str(rs, "email"),
            str(rs, "state"), str(rs, "city"), str(rs, "pincode"), str(rs, "full_address"),
            str(rs, "account_status").toLowerCase(), str(rs, "password"));

    private final NamedParameterJdbcTemplate jdbc;

    public MemberRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Member> findAll() {
        return jdbc.query("SELECT * FROM member_master_tbl ORDER BY full_name", MAPPER);
    }

    public Optional<Member> findById(String memberId) {
        return jdbc.query("SELECT * FROM member_master_tbl WHERE member_id = :id", new MapSqlParameterSource("id", memberId), MAPPER)
                .stream().findFirst();
    }

    public boolean exists(String memberId) {
        return findById(memberId).isPresent();
    }

    public void insert(Member m, String storedPassword) {
        jdbc.update("""
                INSERT INTO member_master_tbl (full_name, dob, contact_no, email, state, city, pincode, full_address,
                                               member_id, password, account_status)
                VALUES (:fullName, :dob, :contactNo, :email, :state, :city, :pincode, :fullAddress, :memberId, :password, :status)
                """, params(m).addValue("password", storedPassword).addValue("status", m.accountStatus()));
    }

    /** Updates personal details only; status and password are changed separately. */
    public int updateDetails(Member m) {
        return jdbc.update("""
                UPDATE member_master_tbl SET full_name = :fullName, dob = :dob, contact_no = :contactNo, email = :email,
                       state = :state, city = :city, pincode = :pincode, full_address = :fullAddress
                WHERE member_id = :memberId
                """, params(m));
    }

    public void updatePassword(String memberId, String storedPassword) {
        jdbc.update("UPDATE member_master_tbl SET password = :password WHERE member_id = :id",
                new MapSqlParameterSource("password", storedPassword).addValue("id", memberId));
    }

    public int updateStatus(String memberId, String status) {
        return jdbc.update("UPDATE member_master_tbl SET account_status = :status WHERE member_id = :id",
                new MapSqlParameterSource("status", status).addValue("id", memberId));
    }

    public int delete(String memberId) {
        return jdbc.update("DELETE FROM member_master_tbl WHERE member_id = :id", new MapSqlParameterSource("id", memberId));
    }

    public int count() {
        Integer n = jdbc.getJdbcTemplate().queryForObject("SELECT COUNT(*) FROM member_master_tbl", Integer.class);
        return n == null ? 0 : n;
    }

    private static MapSqlParameterSource params(Member m) {
        return new MapSqlParameterSource()
                .addValue("memberId", m.memberId())
                .addValue("fullName", m.fullName())
                .addValue("dob", m.dob())
                .addValue("contactNo", m.contactNo())
                .addValue("email", m.email())
                .addValue("state", m.state())
                .addValue("city", m.city())
                .addValue("pincode", m.pincode())
                .addValue("fullAddress", m.fullAddress());
    }
}
