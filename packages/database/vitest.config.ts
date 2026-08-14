import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./tests/global-setup.ts'],
    // The integration tests share one PostgreSQL test database, so files must
    // run sequentially (each cleans up after itself).
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      thresholds: { statements: 80, lines: 80 },
    },
    env: {
      TEST_DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgres://cohortlens:cohortlens@localhost:5432/cohortlens_test',
    },
  },
});
