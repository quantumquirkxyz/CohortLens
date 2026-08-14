import { execSync } from 'node:child_process';

const DEFAULT_URL = 'postgres://cohortlens:cohortlens@localhost:5432/cohortlens';

export default async function globalSetup() {
  // Shared with the database integration suite: create the DB if missing,
  // reset the schema, apply migrations and seed the sample graph.
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? DEFAULT_URL };
  execSync('pnpm --filter @cohortlens/database db:bootstrap', { stdio: 'inherit', env });
}
