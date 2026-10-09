# @repo/ui

Shared React 19 controls styled with Tailwind 4 and `@repo/design-system`, using icons from `@repo/assets/icons`. The package contains Button, Input, Textarea, and React Hook Form/Zod adapters. It has no API access or application state.

Import components by subpath (`@repo/ui/button`, `@repo/ui/input`, `@repo/ui/textarea`, `@repo/ui/form/form-wrapper`, and other `form/*` modules). Import `@repo/ui/styles.css` once at the app layout. `@repo/ui/utils` exposes `cn`, whose custom font-size groups match shared design-system typography.

`useCustomForm` configures a Zod resolver and defaults to validation on change. `FormWrapper` supplies React Hook Form context; `FormInput`/`FormTextarea` bind fields, and `FormButton` can disable invalid/submitting forms. Use these adapters inside `FormWrapper` and supply stable field IDs with the current implementation. Keep feature schemas and submission behavior in the app.

## Build and verification

From the root:

```bash
npx turbo run build --filter=@repo/ui
npm run lint --workspace=@repo/ui
npm run check-types --workspace=@repo/ui
```

`packages/ui/turbo.json` coordinates `build:styles` and `build:components`; the package has no standalone `build` script. Both emit to `dist`. Turbo also coordinates style/component watchers for development. There is no package test runner; the web demos are the current integration surface, and behavioral changes need consumer tests and interaction checks.

## Improvements

- **IMPORTANT:** `FormInput` and `FormTextarea` destructure `formState.errors` before checking whether context exists, so their documented standalone fallback throws. Move the context check before accessing form state and verify both supported usage paths.
- **IMPORTANT:** Input/Textarea labels use caller-provided IDs, while demos omit them. Helper IDs become `undefined-helper`, causing duplicate/ambiguous associations. Generate stable IDs or require and consistently pass them, then test labels and errors by accessible name.
- **IMPORTANT:** Verify field refs and nested field names when extending form adapters: forwarded caller refs are omitted on the controlled branch and errors use direct `errors[name]` lookup. Add regression coverage for intended public contracts.
- **SUGGESTION:** Add focused behavioral tests for disabled button/link behavior, form reset, invalid input, and asynchronous submission; compilation and class snapshots do not cover those interactions.

See [local agent instructions](AGENTS.md).
