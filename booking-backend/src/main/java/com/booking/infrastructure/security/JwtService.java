package com.booking.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Tạo & verify JWT. Dùng HS256 với secret từ application.yml.
 *
 * 📚 Vì sao JWT stateless?
 *  - Backend không cần lưu session → scale ngang dễ (mọi node verify được cùng 1 token).
 *  - Trade-off: muốn revoke token sớm → cần Redis blacklist (sẽ thêm sau).
 */
@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        // HS256 yêu cầu key >= 256 bit (32 bytes).
        this.signingKey = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UUID userId, String email, String role) {
        long nowMs = System.currentTimeMillis();
        // Lưu ý JJWT 0.12.x: .claims(Map) sẽ REPLACE toàn bộ claim,
        // làm mất iss/sub/iat/exp. Phải dùng .claim() cho từng custom claim.
        return Jwts.builder()
                .issuer(properties.issuer())
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(new Date(nowMs))
                .expiration(new Date(nowMs + properties.expirationMs()))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * @return Claims nếu token hợp lệ, null nếu sai chữ ký / hết hạn / bị tamper.
     */
    public Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(properties.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException ex) {
            return null;
        }
    }

    public long getExpirationSeconds() {
        return properties.expirationMs() / 1000;
    }
}
