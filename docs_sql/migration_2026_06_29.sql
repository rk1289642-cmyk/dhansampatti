-- ============================================================
--  Dhansampatti Finance — Migration: 2026-06-29
--  Safe additive migration. All columns use IF NOT EXISTS.
--  No data loss. Safe to run on a live Neon DB.
-- ============================================================

-- ── 1. Channel Partner — new fields on `users` table ─────────
--
--  mobile_no     : 10-digit Indian mobile number
--  dob           : Date of birth
--  aadhar_no     : 12-digit Aadhaar number (stored as text for leading zeros)
--  bank_name     : Bank name (free text, same list as leads)
--  account_no    : Bank account number
--  ifsc_code     : 11-char IFSC code
--  office_address: Full office address
--  pin_code      : 6-digit PIN code
--
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_no      VARCHAR(15);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob            DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhar_no      VARCHAR(12);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name      VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_no     VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ifsc_code      VARCHAR(11);
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_code       VARCHAR(6);

-- ── 2. Lead — new fields on `leads` table ────────────────────
--
--  company    : Applicant company / employer name
--  occupation : 'salaried' | 'self_employed'
--  salary     : Monthly salary (only when occupation = salaried)
--  turnover   : Annual turnover (only when occupation = self_employed)
--  location   : City / area of the applicant
--
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company    VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS occupation VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS salary     NUMERIC(15,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS turnover   NUMERIC(15,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location   VARCHAR(255);

-- ── 3. Indexes (optional but recommended for filtering) ───────
CREATE INDEX IF NOT EXISTS idx_leads_occupation ON leads (occupation);
CREATE INDEX IF NOT EXISTS idx_leads_location   ON leads (location);
