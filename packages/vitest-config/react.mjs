import { defineConfig } from 'vitest/config';

import { sharedTestOptions } from './shared.mjs';

/**
 * Tests for React apps, run in jsdom. Next.js keeps `jsx: "preserve"` in
 * tsconfig, so JSX is compiled here with the automatic runtime instead.
 *
 * @param {{ include?: string[], setupFiles?: string[] }} [options]
 */
export function reactConfig({
  include = ['**/*.test.{ts,tsx}'],
  setupFiles = [],
} = {}) {
  return defineConfig({
    esbuild: { jsx: 'automatic' },
    test: {
      ...sharedTestOptions,
      environment: 'jsdom',
      include,
      exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
      setupFiles,
    },
  });
}
