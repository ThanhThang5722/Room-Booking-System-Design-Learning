package com.booking.infrastructure.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter chạy 1 lần / request (kế thừa OncePerRequestFilter).
 * Đọc Authorization header → verify JWT → đặt Authentication vào SecurityContext.
 *
 * Nếu không có token hoặc token sai → để SecurityContext rỗng và để chain tiếp tục.
 * Spring Security sẽ tự reject 401/403 ở chỗ cần auth.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length());
        Claims claims = jwtService.parse(token);
        if (claims == null) {
            chain.doFilter(request, response);
            return;
        }

        String userId = claims.getSubject();
        String role = claims.get("role", String.class);

        // GrantedAuthority phải có prefix "ROLE_" để @PreAuthorize("hasRole('ADMIN')") hoạt động
        var authority = new SimpleGrantedAuthority("ROLE_" + role);
        var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of(authority));
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(auth);
        chain.doFilter(request, response);
    }
}
