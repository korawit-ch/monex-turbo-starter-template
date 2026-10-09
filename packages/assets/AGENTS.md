# Shared Asset Instructions

- Keep this package limited to raw visual files reused by multiple applications. App-only assets belong in the owning app.
- Organize assets by purpose (`brand`, `illustrations`, `images`), not file extension. Keep related light/dark and resolution variants together.
- Import assets through explicit package subpaths. Do not add a TypeScript barrel that turns file locations into runtime URL assumptions.
- UI glyphs that need React props, `currentColor`, or SVGR processing belong in `@repo/icons`, not here.
- Avoid large videos, generated media, and frequently updated content; serve those from object storage or a CDN.
- Preserve source quality and licensing information. Optimize added files deliberately and inspect visual output in an affected consumer.
- Verify package resolution with an affected application type check and production build; raw-file support is owned by the consuming bundler.
