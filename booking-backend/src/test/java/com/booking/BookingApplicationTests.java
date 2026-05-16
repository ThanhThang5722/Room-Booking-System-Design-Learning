package com.booking;

import com.booking.infrastructure.security.JwtProperties;
import com.booking.infrastructure.security.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test cho JwtService — không cần Spring context, không cần Postgres/Redis.
 *
 * 📚 Vì sao test này, không phải @SpringBootTest?
 *   - @SpringBootTest sẽ cố load full context → cần DB, Redis, Rabbit → CI cần Testcontainers.
 *   - Unit test thuần: nhanh (~50ms vs vài giây), không flaky vì infra, dễ debug.
 *   - Test pyramid: nhiều unit ở đáy, ít integration ở giữa, rất ít e2e ở đỉnh.
 *
 *   Test integration với Testcontainers sẽ thêm khi nhu cầu rõ — đây là smoke test
 *   tối thiểu cho CI pipeline.
 */
class BookingApplicationTests {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties(
                "test-secret-must-be-at-least-32-characters-long-key",
                3_600_000L,
                "test-issuer"
        );
        jwtService = new JwtService(props);
    }

    @Test
    @DisplayName("Generate → parse round-trip giữ nguyên claims")
    void generateAndParseRoundTrip() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateToken(userId, "user@example.com", "GUEST");

        Claims claims = jwtService.parse(token);

        assertNotNull(claims, "Token hợp lệ phải parse ra claims, không null");
        assertEquals(userId.toString(), claims.getSubject());
        assertEquals("user@example.com", claims.get("email", String.class));
        assertEquals("GUEST", claims.get("role", String.class));
        assertEquals("test-issuer", claims.getIssuer());
    }

    @Test
    @DisplayName("Parse token sai chữ ký trả null thay vì throw")
    void parseInvalidTokenReturnsNull() {
        assertNull(jwtService.parse("not.a.valid.jwt.token"));
    }

    @Test
    @DisplayName("Parse token chữ ký bằng secret khác trả null")
    void parseTokenSignedWithDifferentSecretReturnsNull() {
        JwtProperties otherProps = new JwtProperties(
                "another-secret-must-be-at-least-32-characters-different",
                3_600_000L,
                "test-issuer"
        );
        JwtService other = new JwtService(otherProps);
        String token = other.generateToken(UUID.randomUUID(), "x@y.com", "GUEST");

        assertNull(jwtService.parse(token), "Token ký bằng secret khác phải reject");
    }
}
