import { bootstrapTestDatabase } from '../src/test-utils';

const TEST_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://cohortlens:cohortlens@localhost:5432/cohortlens_test';

export default async function globalSetup() {
  await bootstrapTestDatabase(TEST_URL);
}
