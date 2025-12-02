import { sql } from 'drizzle-orm';
import { db } from './drizzle';
import { readFileSync } from 'fs';
import { join } from 'path';

async function migrateCascadeDeletes() {
  console.log('🔄 Running cascade deletes migration...');

  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', 'add-cascade-deletes.sql'),
      'utf-8'
    );

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Cascade deletes migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrateCascadeDeletes();
