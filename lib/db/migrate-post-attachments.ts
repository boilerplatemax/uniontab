import { sql } from 'drizzle-orm';
import { db } from './drizzle';
import { readFileSync } from 'fs';
import { join } from 'path';

async function migratePostAttachments() {
  console.log('🔄 Running post attachments migration...');

  try {
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', 'add-post-attachments-table.sql'),
      'utf-8'
    );

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Post attachments migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

migratePostAttachments();
