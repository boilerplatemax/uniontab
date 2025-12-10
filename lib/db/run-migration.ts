import { sql } from 'drizzle-orm';
import { db } from './drizzle';
import fs from 'fs';
import path from 'path';

async function runMigration(migrationFile: string) {
  console.log(`Running migration: ${migrationFile}`);

  try {
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await db.execute(sql.raw(statement));
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the storage tracking migration
runMigration('add-storage-tracking.sql')
  .then(() => {
    console.log('Storage tracking migration applied successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to apply migration:', error);
    process.exit(1);
  });
