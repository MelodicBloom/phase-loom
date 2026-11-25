# Deployment verification

Verified on November 25, 2026.

- Repository: https://github.com/MelodicBloom/phase-loom (public).
- Instrument: https://phase-loom-live.vercel.app/
- Catalogue: https://phase-loom-live.vercel.app/?view=catalogue&paused=1
- Vercel team: melodicbloom.
- Git-linked project: phase-loom-live.
- First verified implementation commit: `4995a8f3dc6c1928c41e31754532ff6d74634f24`.
- Verified deployment: `dpl_6rorLzF7fgAqxzM4bNZmvce1WUq3`.
- Vercel state: READY. The production alias returned HTTP 200 without a sign-in redirect.

## Hosted verification

The five Playwright scenarios in `tests/runtime.spec.ts` ran against the production alias: **5 passed in 27.1 seconds**.

1. Sculpture rendering, visible control effects, exact image restoration after Undo, target inference/application and timeline reset.
2. Actual React, Vue, Svelte, TypeScript and HTML adapters with matching source blocks.
3. Narrow-screen keyboard operation, reduced motion, state-link round trip and static fallback.
4. WebGL context loss/restoration and refusal to capture a misleading PNG while the context is lost.
5. Visible normal/phase inspection views and exact restoration after Undo.

Verification used Chromium/SwiftShader and a trust pin for this execution environment's proxy CA. It was not a hardware-GPU, physical-phone, cross-browser or screen-reader test.

## Remaining gates

Human visual acceptance and hardware-GPU performance are still open. The previously measured software p95 of 483.3–550.0 ms at 1280x720 does not meet the 20 ms target. See `QA.md`, `PERFORMANCE.json`, `EFFECTS.json` and `ACCESSIBILITY.json` for scope and raw evidence.

## Deployment route

The repository was made public by its owner. Vercel's standard Git integration now deploys the main branch. This avoids the private-organization-repository restriction of the Hobby Git integration. The earlier standalone `phase-loom` project was not used for this runtime; no plan upgrade or renewed manual file upload was performed.
