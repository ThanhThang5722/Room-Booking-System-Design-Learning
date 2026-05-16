-- Admin user. Password = "admin123" (BCrypt hash, strength 10)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
('00000000-0000-0000-0000-000000000001',
 'admin@example.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'System Admin',
 'ADMIN');

-- 3 phòng mẫu để test booking
INSERT INTO rooms (id, room_number, type, price_per_night, capacity, description, status) VALUES
('11111111-1111-1111-1111-111111111101', '101', 'SINGLE', 500000, 1, 'Phòng đơn view phố',         'AVAILABLE'),
('11111111-1111-1111-1111-111111111102', '102', 'DOUBLE', 800000, 2, 'Phòng đôi giường king',      'AVAILABLE'),
('11111111-1111-1111-1111-111111111103', '201', 'SUITE',  1500000, 4, 'Suite cao cấp có ban công','AVAILABLE');
