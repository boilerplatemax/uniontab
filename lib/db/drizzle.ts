import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Configure postgres-js for serverless environments (Vercel)
// Use connection pooling URL if available, otherwise use direct connection with serverless settings
const connectionString = process.env.POSTGRES_URL;

export const client = postgres(connectionString, {
  max: 1, // Limit to 1 connection per serverless function instance
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Timeout connection attempts after 10 seconds
  prepare: false, // Disable prepared statements for better compatibility with connection poolers
});

export const db = drizzle(client, { schema });
