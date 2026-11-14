package com.elibrary.security;

/** The signed-in principal carried in the JWT. role is "admin" or "user". */
public record AuthUser(String id, String name, String role) {
    public boolean isAdmin() {
        return "admin".equals(role);
    }
}
