-- ============================================================
--  Dhansampatti Finance — Neon DB Schema
--  Run this file once on your Neon project.
--  Idempotent: safe to re-run.
-- ============================================================

-- ── 1. Roles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id         SERIAL PRIMARY KEY,
  role_name  VARCHAR(50) NOT NULL UNIQUE   -- 'admin' | 'channel_partner'
);

INSERT INTO roles (role_name) VALUES ('admin'), ('channel_partner')
  ON CONFLICT DO NOTHING;

-- ── 2. Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150)        NOT NULL,
  email         VARCHAR(255)        NOT NULL UNIQUE,
  password_hash TEXT                NOT NULL,
  address       TEXT,
  gender        VARCHAR(10),                         -- 'male' | 'female' | 'other'
  cp_email      VARCHAR(255),                        -- Office / CP email (optional)
  pan_card      VARCHAR(10),                         -- 10-char PAN
  role_id       INT                 NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ── 3. Loan Types ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_types (
  id         SERIAL PRIMARY KEY,
  loan_type  VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO loan_types (loan_type) VALUES
  ('Personal Loan'),
  ('Home Loan'),
  ('Loan Against Property (LAP)'),
  ('Business Loan'),
  ('Car Loan')
ON CONFLICT DO NOTHING;

-- ── 4. Lead Statuses ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_statuses (
  id           SERIAL PRIMARY KEY,
  lead_status  VARCHAR(100) NOT NULL UNIQUE,
  stage_order  INT          NOT NULL DEFAULT 0,      -- for pipeline ordering
  is_terminal  BOOLEAN      NOT NULL DEFAULT FALSE   -- no further progression
);

INSERT INTO lead_statuses (lead_status, stage_order, is_terminal) VALUES
  ('Lead Created',      1, FALSE),
  ('Login',             2, FALSE),
  ('Sanction',          3, FALSE),
  ('Disbursal',         4, FALSE),
  ('Rejected',          99, TRUE),
  ('Legal & Technical', 5, FALSE),    -- Home Loan / LAP only
  ('Transaction',       6, FALSE),    -- Home Loan / LAP only
  ('PDD Clearance',     7, FALSE)     -- Home Loan / LAP only
ON CONFLICT (lead_status) DO UPDATE
  SET stage_order = EXCLUDED.stage_order,
      is_terminal = EXCLUDED.is_terminal;

-- ── 5. Leads ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(200)  NOT NULL,
  phone           VARCHAR(15)   NOT NULL UNIQUE,
  dob             DATE,
  status_id       INT           NOT NULL REFERENCES lead_statuses(id) ON DELETE RESTRICT,
  loan_number     VARCHAR(100),
  loan_type_id    INT           NOT NULL REFERENCES loan_types(id) ON DELETE RESTRICT,
  cp_id           UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- assigned channel partner
  created_by      UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- who added the lead
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 6. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_cp_id          ON leads (cp_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_id      ON leads (status_id);
CREATE INDEX IF NOT EXISTS idx_leads_loan_type_id   ON leads (loan_type_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at     ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone          ON leads (phone);
CREATE INDEX IF NOT EXISTS idx_leads_full_name      ON leads USING gin(to_tsvector('simple', full_name));
CREATE INDEX IF NOT EXISTS idx_users_role_id        ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_users_email          ON users (email);

-- ── 7. Row Level Security (RLS) ──────────────────────────────
--
-- NOTE: Neon supports RLS. Enable it per-table, then define policies.
-- Our application already enforces role-based isolation at the API layer
-- (see /api/leads/route.ts). These RLS policies add a DB-level safety net.
--
-- HOW TO USE:
--   1. Create a DB role per app role (below).
--   2. Set the role in each connection session before querying.
--   3. Neon's serverless driver supports SET LOCAL ROLE per transaction.
--
-- For simplicity in this setup, application-level isolation is primary.
-- The RLS below is supplementary and can be activated when using
-- separate DB roles (advanced deployment).

-- Enable RLS on sensitive tables
ALTER TABLE leads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users  ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all leads (role 'admin' in session)
-- Policy: Channel partners can only see leads where cp_id = current_user_id
--
-- The app passes 'app.current_user_id' and 'app.current_role' as session params.
-- Example in API: SET LOCAL "app.current_user_id" = '<uuid>'; SET LOCAL "app.current_role" = 'channel_partner';

-- Leads: allow admin full access
DROP POLICY IF EXISTS leads_admin_all   ON leads;
CREATE POLICY leads_admin_all ON leads
  AS PERMISSIVE FOR ALL
  USING (current_setting('app.current_role', TRUE) = 'admin');

-- Leads: allow channel partner access only their own
DROP POLICY IF EXISTS leads_cp_own ON leads;
CREATE POLICY leads_cp_own ON leads
  AS PERMISSIVE FOR ALL
  USING (
    current_setting('app.current_role', TRUE) = 'channel_partner'
    AND cp_id = current_setting('app.current_user_id', TRUE)::uuid
  );

-- Users: admins can read all, CPs can only read their own row
DROP POLICY IF EXISTS users_admin_all ON users;
CREATE POLICY users_admin_all ON users
  AS PERMISSIVE FOR ALL
  USING (current_setting('app.current_role', TRUE) = 'admin');

DROP POLICY IF EXISTS users_cp_self ON users;
CREATE POLICY users_cp_self ON users
  AS PERMISSIVE FOR SELECT
  USING (
    current_setting('app.current_role', TRUE) = 'channel_partner'
    AND id = current_setting('app.current_user_id', TRUE)::uuid
  );

-- ── 8. Seed Data — Admin Account ────────────────────────────
--
-- Default admin password: Admin@123
-- bcrypt hash (rounds=12) generated for 'Admin@123':
-- $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oQpAP4mWyPfu
--
-- ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN.
INSERT INTO users (name, email, password_hash, role_id)
VALUES (
  'Super Admin',
  'admin@dhansampatti.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oQpAP4mWyPfu',
  (SELECT id FROM roles WHERE role_name = 'admin')
)
ON CONFLICT (email) DO NOTHING;