# @repo/assets

Raw visual assets shared by more than one application in the monorepo.

This package exposes files through purpose-based subpaths. It does not transform
SVGs into React components and it does not copy files into an application's
public directory.

## Usage

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

## Structure

```text
src/
├── brand/          # Logos, wordmarks, and social cards
├── illustrations/  # Shared decorative or explanatory artwork
└── images/         # Shared photographs and raster images
```

Organize files by purpose rather than by extension so related variants stay
together and can change format without changing their conceptual location.

## Boundaries

- Put SVG glyphs that should become styled React components in `@repo/icons`.
- Keep files used by only one application inside that application's `public`
  directory or source tree.
- Keep large video and frequently updated media in object storage or a CDN.
- Do not add a TypeScript barrel of asset URLs. Static imports let each consumer
  use its own build pipeline.

See [local agent instructions](AGENTS.md).
