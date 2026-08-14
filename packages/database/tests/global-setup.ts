import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { resolve } from 'node:path';
import { createDb } from '../src/client';
import { seedDatabase } from '../src/seed';

const BASE_URL =
  process.env.DATABASE_URL ?? 'postgres://cohortlens:cohortlens@localhost:5432/cohortlens';
const TEST_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://cohortlens:cohortlens@localhost:5432/cohortlens_test';

export default async function globalSetup() {
  const testDbName = new URL(TEST_URL).pathname.slice(1);

  // Ensure the test database exists (CREATE DATABASE cannot run inside a txn).
  const admin = new Pool({ connectionString: BASE_URL });
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    testDbName,
  ]);
  if ((exists.rowCount ?? 0) === 0) {
    await admin.query(`CREATE DATABASE "${testDbName}"`);
  }
  await admin.end();

  // Fresh schema + seed for the tests.
  const db = createDb(TEST_URL);
  await migrate(db, { migrationsFolder: resolve(import.meta.dirname, '../drizzle') });
  await seedDatabase(db);
  await db.$client.end();
}
