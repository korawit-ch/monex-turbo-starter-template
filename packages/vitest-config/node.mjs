import { defineConfig } from 'vitest/config';

import { sharedTestOptions } from './shared.mjs';

/**
 * Unit tests for framework-free TypeScript packages, run in Node.
 *
 * @param {{ include?: string[] }} [options]
 */
export function nodeConfig({ include = ['src/**/*.spec.ts'] } = {}) {
  return defineConfig({
    test: { ...sharedTestOptions, environment: 'node', include },
  });
}
