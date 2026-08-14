import 'dotenv/config';
import { bootstrapTestDatabase } from './test-utils';

async function main() {
  const url =
    process.env.DATABASE_URL ?? 'postgres://cohortlens:cohortlens@localhost:5432/cohortlens';
  await bootstrapTestDatabase(url);
  console.log('Database bootstrapped.');
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
