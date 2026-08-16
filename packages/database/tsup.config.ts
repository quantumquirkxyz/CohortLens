import { defineConfig } from 'tsup';

/**
 * Production build for the migration/seed CLIs used by the `migrate` service
 * (docker/Dockerfile.migrate). `migrate.js` ships next to the package's
 * `drizzle/` folder so the migrator can find the SQL migrations.
 */
export default defineConfig({
  entry: {
    migrate: 'src/migrate.ts',
    seed: 'src/seed-cli.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  // First-party workspace code is bundled (its `main` is TS source); CJS
  // third-party deps stay external (they are part of the deploy output).
  noExternal: ['@cohortlens/shared'],
  external: ['dotenv', 'drizzle-orm', 'pg'],
});
