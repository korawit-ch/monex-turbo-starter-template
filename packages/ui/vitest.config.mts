import { reactConfig } from '@repo/vitest-config/react';

export default reactConfig({
  include: ['src/**/*.test.{ts,tsx}'],
  setupFiles: ['./vitest.setup.ts'],
});
