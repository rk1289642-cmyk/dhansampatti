-- ============================================================
--  Dhansampatti Finance — Migration: 2026-08-14
--  Create lead_comments table for the Lead Details timeline.
-- ============================================================

CREATE TABLE IF NOT EXISTS lead_comments (
  id              SERIAL PRIMARY KEY,
  lead_id         UUID         NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  comment_text    TEXT         NOT NULL,
  old_status_id   INT          REFERENCES lead_statuses(id) ON DELETE SET NULL,
  new_status_id   INT          REFERENCES lead_statuses(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for quick timeline fetching by lead
CREATE INDEX IF NOT EXISTS idx_lead_comments_lead_id ON lead_comments (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_comments_created_at ON lead_comments (created_at DESC);
