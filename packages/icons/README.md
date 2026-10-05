# @repo/icons

SVG icon components package using SVGR for use across multiple apps in the monorepo.

## Installation

This package is part of the monorepo workspace. Install dependencies from the root:

```bash
npm install
```

## Usage

```tsx
import { ArrowRight } from '@repo/icons';

function MyComponent() {
  return (
    <div>
      <ArrowRight className="h-6 w-6 text-blue-500" />
    </div>
  );
}
```

Icons accept all standard SVG props and React props, including:

- `className` - for styling with Tailwind or CSS
- `width` and `height` - for sizing
- `fill` and `stroke` - for colors (only `#000`/`#000000` are replaced with `currentColor`; other source colors remain)

## Adding New Icons

1. Add your SVG file to `src/icons/` (e.g., `my-icon.svg`)
2. Run `npm run build:index` to regenerate the index file; do not edit generated exports manually
3. Run `npm run build` to generate React components
4. The icon will be available as `MyIcon` (kebab-case to PascalCase conversion)

**Example:**

- File: `src/icons/arrow-right.svg`
- Export: `export { default as ArrowRight } from '../dist/ArrowRight';`
- Usage: `import { ArrowRight } from '@repo/icons';`

## Development

Run these scripts inside `packages/icons`, or add `--workspace=@repo/icons` from the root.

- `npm run build` - Build all icons and generate index
- `npm run build:icons` - Build icons only (SVGR conversion)
- `npm run build:index` - Regenerate index.ts from SVG files
- `npm run dev` - Watch mode for development (rebuilds on SVG changes)
- `npm run check-types` - Type check
- `npm run lint` - Lint code

## Configuration

Icons are configured via `.svgrrc.js`:

- **TypeScript enabled** - Generates `.tsx` files
- **SVGO optimization** - Optimizes SVG files
- **Color replacement** - `#000` and `#000000` replaced with `currentColor` for styling flexibility
- **ViewBox preserved** - Ensures proper scaling
- **Icon mode** - Optimized for icon usage

## Project Structure

```
packages/icons/
├── src/
│   ├── icons/          # SVG source files
│   └── index.ts        # Main export file
├── dist/               # Generated React components (gitignored)
├── scripts/
│   └── generate-index.mjs  # Auto-generates index.ts
├── .svgrrc.js         # SVGR configuration
└── package.json
```

## Integration with Apps

This package can be used in any app in the monorepo:

```json
{
  "dependencies": {
    "@repo/icons": "*"
  }
}
```

Make sure to run `npm run build` in the icons package before using icons in your app, or add it as a dependency in your app's build pipeline.

## Improvements

- **IMPORTANT:** The wildcard export in `package.json` targets `dist/*.js`, while the build emits `.tsx` without compiling it to JavaScript. Existing root named imports work through source exports; repair/verify packaging before exposing wildcard imports or publishing.
- **SUGGESTION:** Inspect `app-thai-id.svg` before treating it like a small UI glyph. Generation reports a source exceeding 500 KB; measure its consumer/bundle impact and consider a more suitable representation.

See [local agent instructions](AGENTS.md).
