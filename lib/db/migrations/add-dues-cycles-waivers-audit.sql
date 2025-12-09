-- Add dues cycles, waivers, and audit logging
-- Migration: add-dues-cycles-waivers-audit.sql

-- Create dues cycles table
CREATE TABLE IF NOT EXISTS dues_cycles (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,

  -- Cycle details
  name VARCHAR(255) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Dues amount
  amount_due INTEGER NOT NULL,

  -- Due date
  due_date TIMESTAMP NOT NULL,
  grace_period_days INTEGER NOT NULL DEFAULT 30,

  -- Recurrence
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_type VARCHAR(20),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Add dues cycle reference to dues table
ALTER TABLE dues ADD COLUMN IF NOT EXISTS cycle_id INTEGER REFERENCES dues_cycles(id) ON DELETE SET NULL;

-- Add waiver fields to dues table
ALTER TABLE dues ADD COLUMN IF NOT EXISTS is_waived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE dues ADD COLUMN IF NOT EXISTS waiver_reason TEXT;
ALTER TABLE dues ADD COLUMN IF NOT EXISTS waived_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE dues ADD COLUMN IF NOT EXISTS waived_at TIMESTAMP;

-- Update payment_status to support 'waived' status
-- Note: This is a comment for documentation. PostgreSQL doesn't enforce varchar constraints.

-- Create dues audit log table
CREATE TABLE IF NOT EXISTS dues_audit_log (
  id SERIAL PRIMARY KEY,

  -- What changed
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,

  -- Change details
  action VARCHAR(50) NOT NULL,
  changes_summary TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,

  -- Who and when
  performed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  performed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Context
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dues_cycles_union_id ON dues_cycles(union_id);
CREATE INDEX IF NOT EXISTS idx_dues_cycles_status ON dues_cycles(status);
CREATE INDEX IF NOT EXISTS idx_dues_cycle_id ON dues(cycle_id);
CREATE INDEX IF NOT EXISTS idx_dues_is_waived ON dues(is_waived);
CREATE INDEX IF NOT EXISTS idx_dues_audit_log_entity ON dues_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_dues_audit_log_union_id ON dues_audit_log(union_id);
CREATE INDEX IF NOT EXISTS idx_dues_audit_log_member_id ON dues_audit_log(member_id);
CREATE INDEX IF NOT EXISTS idx_dues_audit_log_performed_at ON dues_audit_log(performed_at);
