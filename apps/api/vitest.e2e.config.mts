import { nestConfig } from '@repo/vitest-config/nest';

// End-to-end tests boot the real Nest app and need a reachable database.
export default nestConfig({ include: ['test/**/*.e2e-spec.ts'] });
