# Storage Limits Migration

This migration adds storage tracking to the unions table.

## What's Changed

- Added `storage_used_bytes` column to `unions` table to track total storage usage
- Storage limits are enforced based on subscription plan:
  - **Free**: 1 GB
  - **Base**: 10 GB
  - **Plus**: 30 GB

## How to Apply

### Option 1: Using psql (Recommended)

If you have direct database access:

```bash
psql $DATABASE_URL -f lib/db/migrations/add-storage-tracking.sql
```

### Option 2: Using a Database Client

1. Connect to your database using your preferred client (pgAdmin, DBeaver, etc.)
2. Run the contents of `lib/db/migrations/add-storage-tracking.sql`

### Option 3: Using Node.js

If you have a database connection setup in your Node.js environment:

```bash
# Create a script to run the migration
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync('lib/db/migrations/add-storage-tracking.sql', 'utf8');
pool.query(sql)
  .then(() => { console.log('Migration complete'); pool.end(); })
  .catch(err => { console.error('Migration failed:', err); pool.end(); });
"
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check that the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'unions'
AND column_name = 'storage_used_bytes';
```

## Initial Data Population

After the migration, you may want to calculate the current storage usage for existing unions:

```sql
-- This will be done automatically by the application when files are uploaded/deleted
-- But you can also manually trigger a recalculation if needed
UPDATE unions SET storage_used_bytes = 0 WHERE storage_used_bytes IS NULL;
```

The application will track storage automatically going forward as files are uploaded and deleted.
