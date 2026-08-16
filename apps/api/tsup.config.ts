import { defineConfig } from 'tsup';

/**
 * Production build for the CohortLens API.
 *
 * First-party workspace packages (`@cohortlens/*`) are bundled into the output
 * (their `main` points at TypeScript source, which Node's native ESM resolver
 * cannot load — directory imports like `./algorithms` fail). Third-party
 * dependencies (hono, drizzle-orm, pg, ...) stay external and are provided by
 * `pnpm deploy --prod` in the runtime image.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  noExternal: ['@cohortlens/shared', '@cohortlens/database', '@cohortlens/lenses'],
  // Keep CJS third-party deps of the bundled workspace packages external:
  // bundling them into ESM output breaks on their dynamic `require` calls.
  external: ['dotenv', 'drizzle-orm', 'pg'],
});
