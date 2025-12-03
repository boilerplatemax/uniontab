import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Use a dummy URL during build if POSTGRES_URL is not set
const connectionString = process.env.POSTGRES_URL || 'postgresql://placeholder';

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });
