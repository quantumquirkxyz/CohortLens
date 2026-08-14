import { defineConfig } from 'vitest/config';
import { coverageThresholds } from '../../vitest.base.config';

export default defineConfig({
  test: {
    ...coverageThresholds,
    globalSetup: ['./tests/global-setup.ts'],
    // The integration tests share one PostgreSQL test database, so files must
    // run sequentially (each cleans up after itself).
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      TEST_DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgres://cohortlens:cohortlens@localhost:5432/cohortlens_test',
    },
    coverage: {
      // bootstrap plumbing for tests/CI is not domain logic — keep it out of
      // the coverage gate so the 80% threshold measures the actual package.
      exclude: ['src/test-utils.ts', 'src/bootstrap-cli.ts'],
    },
  },
});
