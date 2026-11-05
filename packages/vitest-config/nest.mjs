import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

import { sharedTestOptions } from './shared.mjs';

/**
 * Tests for NestJS apps, run in Node.
 *
 * Vite's default transform does not emit decorator metadata, which Nest's
 * dependency injection reads. SWC does: it takes experimentalDecorators and
 * emitDecoratorMetadata from the app's tsconfig.json. The output is ES
 * modules because Vite loads modules as ESM.
 *
 * @param {{ include?: string[] }} [options]
 */
export function nestConfig({ include = ['src/**/*.spec.ts'] } = {}) {
  return defineConfig({
    plugins: [swc.vite({ module: { type: 'es6' } })],
    test: { ...sharedTestOptions, environment: 'node', include },
  });
}
