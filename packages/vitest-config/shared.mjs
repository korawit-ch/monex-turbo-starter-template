/**
 * Test options every preset shares: each test starts from clean mocks and
 * environment stubs, so no test depends on the order the suite runs in.
 * A workspace without tests passes: the template cleanup scripts can remove
 * every test of a package (for example @repo/api-contract after auth:remove
 * and template:finalize).
 */
export const sharedTestOptions = {
  passWithNoTests: true,
  restoreMocks: true,
  unstubEnvs: true,
  unstubGlobals: true,
};
