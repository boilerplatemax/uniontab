-- Migration: Add Dues Tracking System
-- This migration adds tables and fields to support comprehensive dues tracking for union members

-- Step 1: Add delinquency tracking fields to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_delinquent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS delinquent_since TIMESTAMP;

-- Step 2: Create dues table for tracking individual dues records
CREATE TABLE IF NOT EXISTS dues (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in cents
  due_date TIMESTAMP NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- 'paid', 'unpaid', 'partial'
  paid_amount INTEGER NOT NULL DEFAULT 0, -- Amount paid in cents
  paid_date TIMESTAMP,
  payment_method VARCHAR(50), -- 'cash', 'check', 'money_order', 'bank_transfer', etc.
  check_number VARCHAR(100), -- For check payments
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Step 3: Create dues_receipts table for tracking generated receipts
CREATE TABLE IF NOT EXISTS dues_receipts (
  id SERIAL PRIMARY KEY,
  dues_id INTEGER NOT NULL REFERENCES dues(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  receipt_number VARCHAR(100) NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- Amount on receipt in cents
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  generated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Step 4: Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_members_is_delinquent ON members(is_delinquent) WHERE is_delinquent = true;
CREATE INDEX IF NOT EXISTS idx_members_delinquent_since ON members(delinquent_since) WHERE delinquent_since IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dues_member_id ON dues(member_id);
CREATE INDEX IF NOT EXISTS idx_dues_union_id ON dues(union_id);
CREATE INDEX IF NOT EXISTS idx_dues_payment_status ON dues(payment_status);
CREATE INDEX IF NOT EXISTS idx_dues_due_date ON dues(due_date);
CREATE INDEX IF NOT EXISTS idx_dues_paid_date ON dues(paid_date) WHERE paid_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dues_receipts_member_id ON dues_receipts(member_id);
CREATE INDEX IF NOT EXISTS idx_dues_receipts_union_id ON dues_receipts(union_id);
CREATE INDEX IF NOT EXISTS idx_dues_receipts_dues_id ON dues_receipts(dues_id);
CREATE INDEX IF NOT EXISTS idx_dues_receipts_receipt_number ON dues_receipts(receipt_number);

-- Step 5: Add comments for documentation
COMMENT ON COLUMN members.is_delinquent IS 'Flag indicating if member is delinquent on dues payments';
COMMENT ON COLUMN members.delinquent_since IS 'Timestamp when member became delinquent';
COMMENT ON TABLE dues IS 'Tracks individual dues records for union members';
COMMENT ON COLUMN dues.amount IS 'Total amount due in cents';
COMMENT ON COLUMN dues.due_date IS 'Date when payment is due';
COMMENT ON COLUMN dues.payment_status IS 'Payment status: paid, unpaid, or partial';
COMMENT ON COLUMN dues.paid_amount IS 'Amount paid in cents (may be partial)';
COMMENT ON COLUMN dues.paid_date IS 'Date when payment was received';
COMMENT ON COLUMN dues.payment_method IS 'Method of payment (cash, check, money_order, bank_transfer, etc.)';
COMMENT ON COLUMN dues.check_number IS 'Check number for check payments';
COMMENT ON COLUMN dues.notes IS 'Admin notes about this dues record';
COMMENT ON TABLE dues_receipts IS 'Tracks generated receipts for dues payments';
COMMENT ON COLUMN dues_receipts.receipt_number IS 'Unique receipt number';
COMMENT ON COLUMN dues_receipts.amount IS 'Amount on receipt in cents';
