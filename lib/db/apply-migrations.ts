import { client } from './drizzle';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function applyMigrations() {
  const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations');

  // Apply migrations in order
  const migrations = [
    '0003_fix_users_id_to_serial.sql',
    '0004_add_union_public_name.sql'
  ];

  console.log('Starting database migrations...\n');

  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration);
    try {
      console.log(`Applying migration: ${migration}...`);
      const sql = await fs.readFile(migrationPath, 'utf-8');
      await client.unsafe(sql);
      console.log(`✅ Successfully applied: ${migration}\n`);
    } catch (error) {
      console.error(`❌ Error applying ${migration}:`, error);
      throw error;
    }
  }

  console.log('All migrations applied successfully!');
  await client.end();
}

applyMigrations().catch(console.error);
