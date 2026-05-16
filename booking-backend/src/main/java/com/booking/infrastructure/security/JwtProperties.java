package com.booking.infrastructure.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind các giá trị từ application.yml (prefix "app.jwt") thành object.
 * Cách này an toàn hơn @Value vì có type-checking lúc startup.
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        long expirationMs,
        String issuer
) {
}
