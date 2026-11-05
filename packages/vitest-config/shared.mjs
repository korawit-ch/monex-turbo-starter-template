/**
 * Test options every preset shares: each test starts from clean mocks and
 * environment stubs, so no test depends on the order the suite runs in.
 */
export const sharedTestOptions = {
  restoreMocks: true,
  unstubEnvs: true,
  unstubGlobals: true,
};
