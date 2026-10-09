# Shared Asset and Icon Instructions

- Keep this package limited to visual files and icon components reused by multiple frontend consumers. App-only assets belong in the owning app.
- Organize assets by purpose (`brand`, `illustrations`, `images`), not file extension. Keep related light/dark and resolution variants together.
- Import assets through explicit package subpaths. Do not add a TypeScript barrel that turns file locations into runtime URL assumptions.
- Edit icon SVGs in `src/icons` and generation rules in `.svgrrc.js` / `scripts/generate-icons-index.mjs`. Import generated components from `@repo/assets/icons`.
- `src/icons/index.ts` and `dist/icons` are generated. Never edit their exports or component output manually.
- SVG basenames use kebab-case and become PascalCase exports. Renaming or removing a source changes the public component API; inspect UI/web consumers.
- Preserve icon viewBox and intended colors. The generator replaces only `#000`/`#000000` with `currentColor`; raw brand SVGs do not pass through SVGR.
- Avoid large videos, generated media, and frequently updated content; serve those from object storage or a CDN.
- Preserve source quality and licensing information. Optimize added files deliberately and inspect visual output in an affected consumer.
- Verify with the asset lint/build/type checks and affected UI/web builds. Raw-file support is owned by the consuming bundler, and generated type correctness does not prove visual appearance.
