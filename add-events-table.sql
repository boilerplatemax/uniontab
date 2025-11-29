-- Migration: Add events table to existing database
-- This script safely adds the events table without dropping existing data
-- Run this with: psql $POSTGRES_URL -f add-events-table.sql

-- Create EVENTS table
CREATE TABLE IF NOT EXISTS "events" (
  "id" SERIAL PRIMARY KEY,
  "union_id" INTEGER NOT NULL REFERENCES "unions"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "location" TEXT,
  "media_url" TEXT,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "start_time" VARCHAR(10),
  "end_time" VARCHAR(10),
  "is_all_day" BOOLEAN NOT NULL DEFAULT false,
  "is_private" BOOLEAN NOT NULL DEFAULT false,
  "category" VARCHAR(100),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "updated_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "events_union_id_idx" ON "events"("union_id");
CREATE INDEX IF NOT EXISTS "events_start_date_idx" ON "events"("start_date");
CREATE INDEX IF NOT EXISTS "events_end_date_idx" ON "events"("end_date");
CREATE INDEX IF NOT EXISTS "events_is_private_idx" ON "events"("is_private");

-- Create trigger for automatic updated_at updates
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON "events"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
