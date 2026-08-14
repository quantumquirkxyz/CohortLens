import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { resolve } from 'node:path';

const url =
  process.env.DATABASE_URL ?? 'postgres://cohortlens:cohortlens@localhost:5432/cohortlens';

async function main() {
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: resolve(import.meta.dirname, '../drizzle') });
  await pool.end();
  console.log('Migrations applied.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
