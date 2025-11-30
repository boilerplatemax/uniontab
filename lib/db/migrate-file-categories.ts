import { sql } from 'drizzle-orm';
import { db } from './drizzle';
import { readFileSync } from 'fs';
import { join } from 'path';

async function migrateFileCategories() {
  console.log('🔄 Running file categories migration...');

  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', 'add-file-categories.sql'),
      'utf-8'
    );

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ File categories migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrateFileCategories();
