import { client } from './lib/db/drizzle';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');

  const sqlPath = path.join(process.cwd(), 'reset-database.sql');

  try {
    console.log('📖 Reading reset-database.sql...');
    const sql = await fs.readFile(sqlPath, 'utf-8');

    console.log('🗑️  Dropping existing tables and recreating schema...');
    await client.unsafe(sql);

    console.log('\n✅ Database reset complete!');
    console.log('\nYour database now has:');
    console.log('  ✓ users table (id: SERIAL)');
    console.log('  ✓ unions table (with public_name column)');
    console.log('  ✓ members table');
    console.log('  ✓ activity_logs table');
    console.log('  ✓ invitations table');
    console.log('  ✓ union_pages table');
    console.log('\n🚀 Ready to test signup/signin!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

resetDatabase().catch(console.error);
