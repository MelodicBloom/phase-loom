# Phase Loom

A deterministic optical sculpture instrument by MelodicBloom, implemented with WebGL2 and custom GLSL ES 3.00 shaders.

The folded band has 64 geometrically separated lamellae. Aperture changes its opening; phase changes alignment; a rational frequency pair changes the periodic fold. A 720-tick clock animates this configured surface. The copper/cobalt studio material is an artistic model, not calibrated thin-film optics.

## Run

```sh
npm ci
npm run dev
npm test
npm run test:browser
npm run build
```

Browser tests use `/usr/bin/chromium` in this environment; change `executablePath` in `playwright.config.ts` for other systems. Pin dependencies with the committed lockfile. Node 24 is pinned in `.nvmrc` and package metadata.

## Use

- `/`: live instrument. Aperture, phase, ratio, named fixtures, orbit controls, playback, seek, undo/redo, reset, JSON/state-link export and PNG capture.
- `/?paused=1&fixture=F03`: canonical paused fixture.
- `/?view=catalogue&paused=1`: live source catalogue with actual HTML, TypeScript, React, Vue and Svelte adapters.
- `/?fallback=1`: explicitly inspect the non-WebGL fallback.
- `/registry.json`: complete source manifest with dependencies and per-file SHA-256 hashes. This is a custom source manifest, not a published npm package or a shadcn CLI endpoint.

Framework tabs mount the selected framework in the live preview. Copy blocks import the actual source files. The registry includes the core, renderer, custom element and framework adapters with their directory layout intact. Native mobile rendering is not implemented; mobile here means the responsive browser experience.

## Documentation

- [Contract and architecture](docs/ARCHITECTURE.md)
- [Verification / competitive Q&A](docs/QA.md)
- [Raw rendering measurements](docs/PERFORMANCE.json)

The desktop/mobile art direction was approved in the conversation. Human acceptance of the implemented result and a hardware-GPU performance check remain separate gates. Screenshots in `docs/captures` are runtime captures, not generated concepts.

Embedding requires a parent container with a nonzero reserved height. The HTML example specifies one explicitly; framework adapters fill their parent.
