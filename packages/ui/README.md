# @repo/ui

Shared React 19 controls styled with Tailwind 4 and `@repo/design-system`. The package contains Button, Input, Textarea, and React Hook Form/Zod adapters. It has no API access, application state, or icon-library dependency.

Visual variants and content composition are independent. `Button` accepts `startIcon` and `endIcon`; `Input` accepts `startIcon`, `endIcon`, and `errorIcon`. Applications supply any `ReactNode`, so the shared controls do not prescribe an asset package:

```tsx
import { ArrowRight, Error } from '@repo/assets/icons';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';

<Button variant="linked" endIcon={<ArrowRight className="h-5 w-5" />}>
  Continue
</Button>;

<Input error="Required" errorIcon={<Error className="h-5 w-5" />} />;
```

Button `variant`, `color`, and `size` props control styling only. Supplying `href` controls link behavior independently of the selected visual variant.

Import components by subpath (`@repo/ui/button`, `@repo/ui/input`, `@repo/ui/textarea`, `@repo/ui/form/form-wrapper`, and other `form/*` modules). Import `@repo/ui/styles.css` once at the app layout. `@repo/ui/utils` exposes `cn`, whose custom font-size groups match shared design-system typography.

`useCustomForm` configures a Zod resolver and defaults to validation on change. `FormWrapper` supplies React Hook Form context; `FormInput`/`FormTextarea` bind fields, and `FormButton` can disable invalid/submitting forms. Inside `FormWrapper` the adapters bind React Hook Form while still running caller `onChange`/`onBlur` handlers and forwarding refs; outside it they render as plain fields. `useCustomForm` passes every other `useForm` option through. Inputs and textareas generate an id when none is supplied, so labels and helper text stay associated; pass an explicit `id` only when something else must reference the field. Keep feature schemas and submission behavior in the app.

## Build and verification

From the root:

```bash
npx turbo run build --filter=@repo/ui
npm run lint --workspace=@repo/ui
npm run check-types --workspace=@repo/ui
```

`packages/ui/turbo.json` coordinates `build:styles` and `build:components`; the package has no standalone `build` script. Both emit to `dist`. Turbo also coordinates style/component watchers for development. `npm run test --workspace=@repo/ui` runs the component tests (`src/**/*.test.tsx`, Vitest with jsdom) against the source, so no build is needed first; `tsconfig.build.json` keeps them out of `dist`.

## Improvements

- **SUGGESTION:** Add focused behavioral tests for disabled button/link behavior, form reset, invalid input, and asynchronous submission; compilation and class snapshots do not cover those interactions.

See [local agent instructions](AGENTS.md).
