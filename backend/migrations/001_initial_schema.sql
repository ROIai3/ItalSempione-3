-- ============================================
-- ItalSempione Shipping Tracker - Initial Schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) DEFAULT 'admin',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UPLOAD BATCHES
-- ============================================
CREATE TABLE upload_batches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    filename        VARCHAR(255) NOT NULL,
    row_count       INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'processing', -- processing | completed | failed
    error_message   TEXT,
    uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHIPMENTS
-- ============================================
CREATE TABLE shipments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id            UUID REFERENCES upload_batches(id),
    mbl                 VARCHAR(100) NOT NULL,
    carrier             VARCHAR(100) NOT NULL,       -- e.g. MSC, MAERSK, CMA_CGM
    carrier_normalized  VARCHAR(50),                 -- internal key for adapter lookup

    -- Tracking state
    shipment_status     VARCHAR(50) DEFAULT 'pending',  -- pending | in_transit | arrived | delivered | completed | unknown
    current_eta         DATE,
    original_eta        DATE,
    eta_changed         BOOLEAN DEFAULT FALSE,

    -- Check metadata
    last_check_date     TIMESTAMPTZ,
    check_status        VARCHAR(20),                 -- success | failed | pending
    check_error         TEXT,
    check_count         INTEGER DEFAULT 0,

    -- Monitoring
    is_active           BOOLEAN DEFAULT TRUE,        -- FALSE once delivered/arrived
    monitoring_stopped_at TIMESTAMPTZ,

    -- Raw data from Excel
    raw_data            JSONB,                       -- full row from Excel for reference

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipments_mbl ON shipments(mbl);
CREATE INDEX idx_shipments_active ON shipments(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_shipments_carrier ON shipments(carrier_normalized);
CREATE INDEX idx_shipments_batch ON shipments(batch_id);

-- ============================================
-- ETA HISTORY (change log)
-- ============================================
CREATE TABLE eta_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id     UUID REFERENCES shipments(id) ON DELETE CASCADE,
    previous_eta    DATE,
    new_eta         DATE,
    changed_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eta_history_shipment ON eta_history(shipment_id);

-- ============================================
-- TRACKING LOG (audit trail)
-- ============================================
CREATE TABLE tracking_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id     UUID REFERENCES shipments(id) ON DELETE CASCADE,
    carrier         VARCHAR(50),
    request_payload JSONB,
    response_payload JSONB,
    http_status     INTEGER,
    status          VARCHAR(20),     -- success | failed | timeout
    error_message   TEXT,
    duration_ms     INTEGER,
    checked_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracking_log_shipment ON tracking_log(shipment_id);
CREATE INDEX idx_tracking_log_date ON tracking_log(checked_at);

-- ============================================
-- SEED: default admin user
-- password: changeme (bcrypt hash)
-- ============================================
-- INSERT handled in seeds/
