package com.booking.domain.user.dto;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String tokenType,   // luôn là "Bearer"
        long expiresIn,     // giây
        UUID userId,
        String email,
        String fullName,
        String role
) {
}
