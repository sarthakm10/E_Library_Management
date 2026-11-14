package com.elibrary.member;

import com.fasterxml.jackson.annotation.JsonIgnore;

/** A row of member_master_tbl. The password is never serialised. */
public record Member(
        String memberId,
        String fullName,
        String dob,
        String contactNo,
        String email,
        String state,
        String city,
        String pincode,
        String fullAddress,
        String accountStatus,
        @JsonIgnore String password) {
}
