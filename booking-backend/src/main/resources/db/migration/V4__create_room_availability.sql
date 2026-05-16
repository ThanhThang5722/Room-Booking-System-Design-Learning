-- Bảng pre-compute availability — Phase 3 sẽ kết hợp với Redis cache TTL 60s
-- Mỗi (room_id, date) là 1 dòng. Khi booking confirmed → set is_available=false.
CREATE TABLE room_availability (
    room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (room_id, date)
);

CREATE INDEX idx_availability_lookup ON room_availability(room_id, date);
