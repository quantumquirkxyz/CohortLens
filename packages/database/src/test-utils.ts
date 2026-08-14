import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { resolve } from 'node:path';
import { createDb } from './client';
import { seedDatabase } from './seed';

/**
 * Point a test/e2e run at a pristine, seeded PostgreSQL database:
 * create the database if missing, drop its schemas, apply the migrations and
 * seed the sample graph. Used by the database integration suite and the
 * Playwright e2e global setup so both share one bootstrap path.
 */
export async function bootstrapTestDatabase(url: string): Promise<void> {
  const dbName = new URL(url).pathname.slice(1);

  // CREATE DATABASE cannot run inside a transaction; connect to the server
  // (any database) and create the target one if it is missing.
  const server = new URL(url);
  server.pathname = '/postgres';
  const admin = new Pool({ connectionString: server.toString() });
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if ((exists.rowCount ?? 0) === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
  }
  await admin.end();

  // Drop the schemas so every run starts from the pristine seeded state. The
  // drizzle migrator keeps its bookkeeping table in its own schema, so both
  // must go.
  const db = createDb(url);
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await migrate(db, { migrationsFolder: resolve(import.meta.dirname, '../drizzle') });
  await seedDatabase(db);
  await db.$client.end();
}
