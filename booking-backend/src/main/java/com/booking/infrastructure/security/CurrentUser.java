package com.booking.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Lấy userId của user đang đăng nhập từ SecurityContext.
 * JwtAuthFilter đã set Authentication.principal = userId (String).
 */
public final class CurrentUser {

    private CurrentUser() {}

    public static UUID requireUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("No authenticated user");
        }
        return UUID.fromString(auth.getPrincipal().toString());
    }
}
