-- Add navConfig JSON column to unions table
ALTER TABLE unions ADD COLUMN IF NOT EXISTS nav_config JSON;

-- Create document_collections table
CREATE TABLE IF NOT EXISTS document_collections (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL REFERENCES unions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id)
);

-- Create document_collection_files table
CREATE TABLE IF NOT EXISTS document_collection_files (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES document_collections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  uploaded_by INTEGER NOT NULL REFERENCES users(id)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_document_collections_union_id ON document_collections(union_id);
CREATE INDEX IF NOT EXISTS idx_document_collection_files_collection_id ON document_collection_files(collection_id);
