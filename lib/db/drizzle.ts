import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization to avoid errors during build time
// During build, we create a placeholder. At runtime, we'll have the real connection.
let clientInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function initializeDb() {
  if (!dbInstance) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    clientInstance = postgres(process.env.POSTGRES_URL);
    dbInstance = drizzle(clientInstance, { schema });
  }
  return dbInstance;
}

// For build time, we need to export something that has the right type
// but won't actually be executed during the build process
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(target, prop) {
    const instance = initializeDb();
    return instance[prop as keyof typeof instance];
  }
}) as ReturnType<typeof drizzle<typeof schema>>;

export const client = new Proxy({} as ReturnType<typeof postgres>, {
  get(target, prop) {
    if (!clientInstance) {
      initializeDb();
    }
    return clientInstance?.[prop as keyof typeof clientInstance];
  }
}) as ReturnType<typeof postgres>;
