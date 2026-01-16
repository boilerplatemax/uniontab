-- Add SMS tracking columns to unions table
ALTER TABLE unions ADD COLUMN IF NOT EXISTS monthly_sms_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE unions ADD COLUMN IF NOT EXISTS sms_usage_reset_date TIMESTAMP DEFAULT (DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month');

-- Create mass_sms table
CREATE TABLE IF NOT EXISTS mass_sms (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  recipient_filter VARCHAR(50) NOT NULL,
  custom_recipient_ids JSON,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  total_recipients INTEGER,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id SERIAL PRIMARY KEY,
  mass_sms_id INTEGER NOT NULL REFERENCES mass_sms(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  twilio_sid VARCHAR(50),
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mass_sms_union_id ON mass_sms(union_id);
CREATE INDEX IF NOT EXISTS idx_mass_sms_created_by ON mass_sms(created_by);
CREATE INDEX IF NOT EXISTS idx_mass_sms_status ON mass_sms(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_mass_sms_id ON sms_logs(mass_sms_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_member_id ON sms_logs(member_id);
