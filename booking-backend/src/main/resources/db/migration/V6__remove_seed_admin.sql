-- V5 trước đó seed admin với hash sai (map sang "password" thay vì "admin123").
-- Xóa để DataInitializer (Spring component) tạo lại với BCrypt encode đúng.
DELETE FROM users WHERE email = 'admin@example.com';
