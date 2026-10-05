# Shared UI Instructions

- Keep this package independent of Next.js routing, API access, and app state. `src` owns reusable controls; `src/form` adapts them to React Hook Form and Zod. See [README.md](README.md).
- Use `cn` from `src/utils.ts`. Its custom font-size groups track typography utilities in `@repo/design-system/shared-styles.css`; keep those sources aligned when typography changes.
- Consume icons from `@repo/icons` and tokens from `@repo/design-system`. Keep app-specific validation and submission behavior in the consumer.
- Preserve ref forwarding, button/link semantics, disabled/submitting behavior, and form-context integration. Inspect `apps/web/components/*-demo.tsx` when changing public props.
- Current inputs rely on caller-supplied IDs for labels/helper text. Current form inputs/textareas require context in practice despite their fallback comments. Fix and behavior-test these contracts deliberately when changing the controls; do not document the comments as guarantees.
- Component/style outputs are generated into `dist`. Package exports expose component subpaths, `styles.css`, and source `utils`; there is no root component barrel.
- Use `npx turbo run build --filter=@repo/ui` from the root to coordinate dependencies and both output tasks. Direct scripts are `build:components` and `build:styles`, not `build`.
- Verify with `npm run lint --workspace=@repo/ui`, `npm run check-types --workspace=@repo/ui`, and the web consumer's tests/build. No UI test runner is configured; exercise keyboard, labels/errors, reset, async submit, and disabled states for behavior changes.
