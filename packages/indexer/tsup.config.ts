import { defineConfig } from 'tsup';

/**
 * Production build for the CohortLens indexer sync service.
 *
 * Bundles first-party workspace packages (`@cohortlens/shared`,
 * `@cohortlens/database`) into the output; third-party dependencies (hono,
 * drizzle-orm, pg, ...) stay external and are provided by
 * `pnpm deploy --prod` in the runtime image.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  noExternal: ['@cohortlens/shared', '@cohortlens/database'],
  // Keep CJS third-party deps of the bundled workspace packages external.
  external: ['dotenv', 'drizzle-orm', 'pg'],
});
