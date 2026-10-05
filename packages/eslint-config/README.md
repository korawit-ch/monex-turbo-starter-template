# @repo/eslint-config

Shared ESLint flat configurations used by root and workspace `eslint.config.mjs` files:

- `/base`: JavaScript/TypeScript recommended rules, Prettier conflict suppression, Turbo environment declarations, and local quality rules.
- `/nest-js`: Node/Jest globals and Nest-oriented type-aware rules; used by `apps/api`.
- `/next-js`: Next.js, React, hooks, and type-aware rules; used by `apps/web`.
- `/react-internal`: shared React/hooks rules; used by UI and icons.
- `/library`: an additional library preset, currently unused by workspace configs.
- `/prettier-base`: the base Prettier settings extended by the root `.prettierrc.mjs` with the Tailwind plugin.

There is no lint/test script in this package. Validate preset changes through affected workspace lint commands or `npx turbo run lint` from the root. Root `npm run lint` also checks formatting. Check actual consumers before changing preset exports or parser/project configuration.

## Improvements

- **IMPORTANT:** The unused `/library` preset still contains an `env` key from legacy ESLint configuration; migrate it to flat-config globals before adopting it in a workspace.
- **SUGGESTION:** Keep frontend lint tooling aligned with the installed Next.js major when updating dependencies: the application declares Next 16, while this package declares the Next ESLint plugin at major 15. Verify compatibility rather than assuming shared version ranges match.
