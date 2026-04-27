// One-off migration script — run with: node scripts/migrate.mjs
// Requires DATABASE_URL to be set in the environment, e.g.:
//   set DATABASE_URL=<your_neon_url> && node scripts/migrate.mjs
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL env variable is not set.');

const sql = neon(DATABASE_URL);

const statements = [
  // Roles
  `CREATE TABLE IF NOT EXISTS roles (
    id        SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
  )`,
  `INSERT INTO roles (role_name) VALUES ('admin'), ('channel_partner') ON CONFLICT DO NOTHING`,

  // Users
  `CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash TEXT          NOT NULL,
    address       TEXT,
    gender        VARCHAR(10),
    cp_email      VARCHAR(255),
    pan_card      VARCHAR(10),
    role_id       INT           NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  )`,

  // Loan Types
  `CREATE TABLE IF NOT EXISTS loan_types (
    id        SERIAL PRIMARY KEY,
    loan_type VARCHAR(100) NOT NULL UNIQUE
  )`,
  `INSERT INTO loan_types (loan_type) VALUES
    ('Personal Loan'),
    ('Home Loan'),
    ('Loan Against Property (LAP)'),
    ('Business Loan'),
    ('Car Loan')
  ON CONFLICT DO NOTHING`,

  // Lead Statuses
  `CREATE TABLE IF NOT EXISTS lead_statuses (
    id          SERIAL PRIMARY KEY,
    lead_status VARCHAR(100) NOT NULL UNIQUE
  )`,
  `INSERT INTO lead_statuses (lead_status) VALUES
    ('Lead Created'),
    ('Login'),
    ('Sanction'),
    ('Disbursal'),
    ('Rejected'),
    ('Legal & Technical'),
    ('Transaction'),
    ('PDD Clearance')
  ON CONFLICT DO NOTHING`,

  // Leads
  `CREATE TABLE IF NOT EXISTS leads (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name    VARCHAR(200) NOT NULL,
    phone        VARCHAR(15)  NOT NULL UNIQUE,
    dob          DATE,
    status_id    INT          NOT NULL REFERENCES lead_statuses(id) ON DELETE RESTRICT,
    loan_number  VARCHAR(100),
    loan_type_id INT          NOT NULL REFERENCES loan_types(id) ON DELETE RESTRICT,
    cp_id        UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_by   UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_leads_cp_id        ON leads (cp_id)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_status_id    ON leads (status_id)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_loan_type_id ON leads (loan_type_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_role_id      ON users (role_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email)`,
];

async function migrate() {
  console.log('⏳  Applying schema to Neon...\n');
  for (const stmt of statements) {
    const preview = stmt.trim().split('\n')[0].slice(0, 60);
    try {
      await sql.query(stmt);
      console.log(`  ✅  ${preview}`);
    } catch (err) {
      console.error(`  ❌  ${preview}\n      ${err.message}`);
      process.exit(1);
    }
  }
  console.log('\n🎉  Migration complete!');
}

migrate();
