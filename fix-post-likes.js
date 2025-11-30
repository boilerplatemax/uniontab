#!/usr/bin/env node

require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const postgresUrl = process.env.POSTGRES_URL;

  if (!postgresUrl) {
    console.error('❌ POSTGRES_URL environment variable is not set.');
    console.log('\nPlease run this script with your database URL:');
    console.log('POSTGRES_URL="your-connection-string" node fix-post-likes.js\n');
    process.exit(1);
  }

  const sql = postgres(postgresUrl);

  try {
    console.log('Connecting to database...');

    // Check if table already exists
    const checkResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'post_likes'
      );
    `;

    if (checkResult[0].exists) {
      console.log('✅ post_likes table already exists!');
      await sql.end();
      process.exit(0);
    }

    console.log('Creating post_likes table...');

    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-post-likes-table.sql'),
      'utf-8'
    );

    await sql.unsafe(migrationSQL);

    console.log('✅ post_likes table created successfully!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    await sql.end();
    process.exit(1);
  }
}

applyMigration();
