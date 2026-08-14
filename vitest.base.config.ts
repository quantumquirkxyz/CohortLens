/**
 * Shared coverage thresholds for the core packages (Fase 7 criterion:
 * coverage > 80% for packages/core). Individual packages spread this into
 * their own vitest `test` config. Deliberately does not import vitest so the
 * file type-checks from any package's tsconfig (vitest is not hoisted to the
 * repo root under pnpm strict).
 */
export const coverageThresholds = {
  coverage: {
    provider: 'v8' as const,
    thresholds: { statements: 80 as const, lines: 80 as const },
  },
};
