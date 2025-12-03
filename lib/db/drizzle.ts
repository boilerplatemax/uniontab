import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Load environment variables in development only
// Vercel provides env vars directly in production, so dotenv is not needed
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch {
    // dotenv might not be available in some environments, that's ok
  }
}

// Validate environment variable
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Configure postgres-js for serverless environments (Vercel)
// IMPORTANT: Make sure to use a connection pooling URL in production
// Examples:
//   Supabase: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
//   Neon: postgresql://[user]:[password]@[project].pooler.neon.tech/[db]
const connectionString = process.env.POSTGRES_URL;

// Create postgres client with serverless-optimized settings
// The client will be reused across function invocations in the same container
const client = postgres(connectionString, {
  max: 1, // Limit to 1 connection per serverless function instance
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Timeout connection attempts after 10 seconds
  prepare: false, // Disable prepared statements for better compatibility with connection poolers
  onnotice: () => {}, // Silence notices to reduce noise in logs
});

export { client };
export const db = drizzle(client, { schema });
