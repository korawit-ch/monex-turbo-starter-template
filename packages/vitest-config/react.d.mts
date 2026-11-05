import type { UserConfig } from 'vitest/config';

export function reactConfig(options?: {
  include?: string[];
  setupFiles?: string[];
}): UserConfig;
