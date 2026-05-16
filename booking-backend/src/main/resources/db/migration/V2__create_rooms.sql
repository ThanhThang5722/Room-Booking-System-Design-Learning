CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number     VARCHAR(20) UNIQUE NOT NULL,
    type            VARCHAR(50) NOT NULL,             -- SINGLE | DOUBLE | SUITE
    price_per_night NUMERIC(10,2) NOT NULL,
    capacity        INT NOT NULL,
    description     TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE | MAINTENANCE
    version         BIGINT NOT NULL DEFAULT 0,        -- Optimistic lock (@Version)
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
