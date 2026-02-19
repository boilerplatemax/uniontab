import { sql } from 'drizzle-orm';
import { db } from './drizzle';
import { readFileSync } from 'fs';
import { join } from 'path';

async function migrateGalleryNav() {
  console.log('🔄 Running gallery navigation migration...');

  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', 'add-gallery-nav-items.sql'),
      'utf-8'
    );

    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Gallery navigation migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

migrateGalleryNav();
