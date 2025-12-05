import { sql } from 'drizzle-orm';
import { db } from './drizzle';
import { readFileSync } from 'fs';
import { join } from 'path';

async function migrateThemes() {
  console.log('🔄 Running themes system migration...');

  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', 'add-themes-system.sql'),
      'utf-8'
    );

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Themes system migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrateThemes();
