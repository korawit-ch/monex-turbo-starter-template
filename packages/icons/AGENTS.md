# Icon Instructions

- Edit SVGs in `src/icons` and generation rules in `.svgrrc.js` / `scripts/generate-index.mjs`. `dist/*.tsx` and `src/index.ts` are generated; never edit their exports manually.
- SVG basenames use kebab-case and become PascalCase named exports, for example `arrow-right.svg` → `ArrowRight`. Renaming/removing a source changes the public API; inspect UI/web consumers.
- Preserve viewBox and intended colors. The generator replaces only `#000`/`#000000` with `currentColor`; not every asset is monochrome.
- Build from the root with `npm run build --workspace=@repo/icons`. Use the root named exports; the current wildcard export points at `.js` although SVGR emits `.tsx` (see [README.md](README.md)).
- Verify with `npm run lint --workspace=@repo/icons`, `npm run check-types --workspace=@repo/icons`, and affected UI/web builds. Visually inspect changed assets; generated type correctness does not prove appearance.
- Keep generated `src/index.ts` synchronized and review its tracked diff after builds. Avoid large embedded raster payloads in new UI glyphs; inspect actual asset size when investigating build/bundle cost.
