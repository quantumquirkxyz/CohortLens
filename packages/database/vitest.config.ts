import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./tests/global-setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      TEST_DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgres://cohortlens:cohortlens@localhost:5432/cohortlens_test',
    },
  },
});
