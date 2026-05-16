package com.booking.config;

import com.booking.domain.user.User;
import com.booking.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Bootstrap admin user khi app start.
 *
 * 📚 Vì sao không seed admin bằng Flyway?
 *   - Flyway insert SQL trực tiếp → phải hardcode BCrypt hash trong file SQL.
 *   - Hash dễ sai (như mình đã sai ở V5), và mỗi lần đổi password phải tự
 *     generate hash bằng tool ngoài.
 *   - Để Spring encode runtime: dùng đúng PasswordEncoder bean → không bao
 *     giờ lệch giữa "password seed" và "password login".
 *
 * Idempotent: nếu admin đã tồn tại, không làm gì. An toàn khi restart.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin user '{}' already exists — skip bootstrap.", adminEmail);
            return;
        }

        User admin = User.builder()
                .id(UUID.randomUUID())
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .fullName("System Admin")
                .role(User.Role.ADMIN)
                .build();
        userRepository.save(admin);

        log.warn("Bootstrapped admin user: email={}, password={} — ĐỔI password trong production!",
                adminEmail, adminPassword);
    }
}
