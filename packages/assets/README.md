# @repo/assets

Shared visual assets and generated SVG icon components for frontend consumers.
Raw files and React components use separate subpaths so their runtime behavior
stays explicit.

## Raw asset usage

Use a static import so the consuming bundler owns hashing, optimization, and the
final public URL:

```tsx
import Image from 'next/image';
import type { StaticImageData } from 'next/image';

import turborepoLogo from '@repo/assets/brand/turborepo-dark.svg';

const turborepoLogoImage = turborepoLogo as StaticImageData;

export function BrandLogo() {
  return <Image src={turborepoLogoImage} alt="Turborepo" priority />;
}
```

The consumer must support imports for the selected file type. Next.js bundles
common static image formats, but its global SVG declaration is intentionally
untyped, so the consumer narrows the imported value at its framework boundary.

## Icon usage

SVGs in `src/icons` are converted to React components with SVGR:

```tsx
import { ArrowRight } from '@repo/assets/icons';

export function ContinueIcon() {
  return <ArrowRight className="h-5 w-5 text-blue-500" />;
}
```

Add an icon as a kebab-case SVG, then regenerate and validate the component
entry point:

```bash
npm run build --workspace=@repo/assets
npm run lint --workspace=@repo/assets
npm run check-types --workspace=@repo/assets
```

## Structure

```text
src/
├── brand/          # Raw logos, wordmarks, and social cards
├── icons/          # SVG sources plus the generated component index
├── illustrations/  # Raw decorative or explanatory artwork
└── images/         # Raw photographs and raster images
dist/
└── icons/           # Generated React components (gitignored)
```

Organize files by purpose rather than by extension so related variants stay
together and can change format without changing their conceptual location.

## Boundaries

- Put SVG glyphs that need React props or `currentColor` in `src/icons` and
  consume them from `@repo/assets/icons`.
- Keep logos and illustrations as raw files when exact colors, gradients, or
  URL semantics matter; an SVG extension alone does not make a file an icon.
- Keep files used by only one application inside that application's `public`
  directory or source tree.
- Keep large video and frequently updated media in object storage or a CDN.
- Do not add a TypeScript barrel of asset URLs. Static imports let each consumer
  use its own build pipeline.
- Do not edit `src/icons/index.ts` or `dist/icons` manually; both are generated.

See [local agent instructions](AGENTS.md).
