-- Cần extension btree_gist để dùng "room_id WITH =" trong EXCLUDE constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    room_id     UUID NOT NULL REFERENCES rooms(id),
    check_in    DATE NOT NULL,
    check_out   DATE NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',  -- CONFIRMED | CANCELLED
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (check_out > check_in),

    -- LỚP PHÒNG THỦ CUỐI CÙNG (Layer 3):
    -- Postgres tự reject bất kỳ INSERT/UPDATE nào tạo ra 2 booking trùng phòng + trùng khoảng ngày.
    -- daterange(check_in, check_out) là half-open [check_in, check_out), nên hai booking
    -- liền kề (ví dụ: check_out = 2026-06-01 và check_in = 2026-06-01) KHÔNG bị coi là overlap.
    CONSTRAINT no_overlap EXCLUDE USING gist (
        room_id WITH =,
        daterange(check_in, check_out) WITH &&
    ) WHERE (status = 'CONFIRMED')
);

CREATE INDEX idx_bookings_room_dates ON bookings(room_id, check_in, check_out);
CREATE INDEX idx_bookings_user ON bookings(user_id);
