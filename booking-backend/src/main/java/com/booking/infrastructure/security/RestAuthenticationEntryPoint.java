package com.booking.infrastructure.security;

import com.booking.shared.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Khi request thiếu/sai JWT → Spring Security gọi entry point này.
 * Khi request có JWT đúng nhưng thiếu role → gọi access denied handler.
 *
 * Mặc định Spring trả body RỖNG → frontend không có code/message để map →
 * UI hiển thị "Lỗi kết nối" gây nhầm lẫn. Component này trả JSON theo chuẩn
 * ApiResponse của toàn app.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Chưa xác thực → 401 + JSON code UNAUTHORIZED */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        writeJson(response, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED",
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
    }

    /** Đã xác thực nhưng không đủ quyền → 403 + JSON code FORBIDDEN */
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        writeJson(response, HttpStatus.FORBIDDEN, "FORBIDDEN",
                "Bạn không có quyền thực hiện thao tác này");
    }

    private void writeJson(HttpServletResponse response, HttpStatus status,
                           String code, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), ApiResponse.fail(code, message));
    }
}
