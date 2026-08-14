import { execSync } from 'node:child_process';

const DEFAULT_URL = 'postgres://cohortlens:cohortlens@localhost:5432/cohortlens';

export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;

  // Ensure the database exists (CREATE DATABASE cannot run inside a txn, but
  // psql -c autocommits). This is a no-op when the DB already exists.
  const dbName = new URL(url).pathname.slice(1);
  const exists = execSync(
    `psql "${url}" -tAc "SELECT 1 FROM pg_database WHERE datname = '${dbName}'"`,
    { stdio: ['ignore', 'pipe', 'inherit'] },
  )
    .toString()
    .trim();
  if (exists !== '1') {
    execSync(`psql "${url}" -c "CREATE DATABASE \\"${dbName}\\""`, { stdio: 'inherit' });
  }

  // Fresh schema + sample graph (idempotent against an already-seeded DB).
  const env = { ...process.env, DATABASE_URL: url };
  execSync('pnpm --filter @cohortlens/database db:migrate', { stdio: 'inherit', env });
  execSync('pnpm --filter @cohortlens/database db:seed', { stdio: 'inherit', env });
}
