import { defineConfig } from 'vitest/config';
import { coverageThresholds } from '../../vitest.base.config';

export default defineConfig({
  test: {
    ...coverageThresholds,
  },
});
