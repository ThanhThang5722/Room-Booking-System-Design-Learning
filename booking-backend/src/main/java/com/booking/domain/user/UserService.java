package com.booking.domain.user;

import com.booking.domain.user.dto.AuthResponse;
import com.booking.domain.user.dto.LoginRequest;
import com.booking.domain.user.dto.RegisterRequest;
import com.booking.infrastructure.security.JwtService;
import com.booking.shared.exception.EmailAlreadyUsedException;
import com.booking.shared.exception.InvalidCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Đăng ký user mới. Default role = GUEST.
     * @Transactional: nếu BCrypt hash fail hoặc DB save fail → rollback toàn bộ.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyUsedException(request.email());
        }

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .role(User.Role.GUEST)
                .build();

        userRepository.save(user);
        return buildAuthResponse(user);
    }

    /**
     * Login. Lưu ý: KHÔNG tiết lộ "email không tồn tại" vs "sai password" —
     * gộp chung thành 1 message để chống enumeration attack.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        );
    }
}
