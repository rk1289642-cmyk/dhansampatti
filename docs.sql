-- ============================================================
--  Dhansampatti Finance — Neon DB Schema
--  Run this file once on your Neon project.
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
  lead_status  VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO lead_statuses (lead_status) VALUES
  ('Lead Created'),
  ('Login'),
  ('Sanction'),
  ('Disbursal'),
  ('Rejected'),
  ('Legal & Technical'),      -- Home Loan / LAP only
  ('Transaction'),            -- Home Loan / LAP only
  ('PDD Clearance')           -- Home Loan / LAP only
ON CONFLICT DO NOTHING;

-- ── 5. Leads ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(200)  NOT NULL,
  phone           VARCHAR(15)   NOT NULL UNIQUE,
  dob             DATE,
  status_id       INT           NOT NULL REFERENCES lead_statuses(id) ON DELETE RESTRICT,
  loan_number     VARCHAR(100),
  loan_type_id    INT           NOT NULL REFERENCES loan_types(id) ON DELETE RESTRICT,
  cp_id           UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- channel partner FK
  created_by      UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- who added the lead
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 6. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_cp_id          ON leads (cp_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_id      ON leads (status_id);
CREATE INDEX IF NOT EXISTS idx_leads_loan_type_id   ON leads (loan_type_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id        ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_users_email          ON users (email);
