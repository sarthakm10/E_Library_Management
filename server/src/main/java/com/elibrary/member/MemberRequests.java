package com.elibrary.member;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class MemberRequests {
    private MemberRequests() {}

    public record Signup(
            @NotBlank(message = "Member ID is required")
            @Pattern(regexp = "^[A-Za-z0-9_.-]{3,30}$", message = "Member ID must be 3-30 letters, numbers, . _ or -")
            String memberId,
            @NotBlank(message = "Password is required") @Size(min = 6, max = 50, message = "Password must be 6-50 characters")
            String password,
            @NotBlank(message = "Full name is required") @Size(max = 100) String fullName,
            @NotBlank(message = "Date of birth is required") String dob,
            @NotBlank(message = "Contact number is required") @Pattern(regexp = "^[0-9+ -]{7,15}$", message = "Enter a valid contact number")
            String contactNo,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "State is required") String state,
            @NotBlank(message = "City is required") String city,
            @NotBlank(message = "Pincode is required") @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be 6 digits")
            String pincode,
            @NotBlank(message = "Address is required") @Size(max = 500) String fullAddress) {
    }

    public record UpdateProfile(
            @NotBlank(message = "Full name is required") @Size(max = 100) String fullName,
            @NotBlank(message = "Date of birth is required") String dob,
            @NotBlank(message = "Contact number is required") @Pattern(regexp = "^[0-9+ -]{7,15}$", message = "Enter a valid contact number")
            String contactNo,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "State is required") String state,
            @NotBlank(message = "City is required") String city,
            @NotBlank(message = "Pincode is required") @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be 6 digits")
            String pincode,
            @NotBlank(message = "Address is required") @Size(max = 500) String fullAddress) {
    }

    public record ChangePassword(
            @NotBlank(message = "Current password is required") String currentPassword,
            @NotBlank(message = "New password is required") @Size(min = 6, max = 50, message = "Password must be 6-50 characters")
            String newPassword) {
    }

    public record UpdateStatus(
            @NotBlank @Pattern(regexp = "^(active|pending|deactive)$", message = "Status must be active, pending or deactive")
            String status) {
    }
}
