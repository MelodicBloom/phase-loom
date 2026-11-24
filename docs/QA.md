# Verification and competitive Q&A

This report distinguishes automated evidence from design judgment. It is not an Awwwards score, a claim of superiority over another site, or a hardware performance certification.

## Challenge questions

| Challenge                                                         | Measurable evidence                                                                                                                                                 | Result / limit                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Do controls change the object rather than decorate the interface? | `scripts/measure-effects.mjs`: each of aperture, phase and ratio must change >=1% of pixels by >8/255 in at least one RGB channel.                                  | Passed. See exact fractions, RMSE and drawing-buffer dimensions in `EFFECTS.json`.                             |
| Is a state actually reproducible?                                 | 100 render/change/restore comparisons at a fixed 320x180 drawing buffer.                                                                                            | 100/100 pixel-exact matches on the same Chromium/SwiftShader setup. No cross-device pixel claim.               |
| Can an edit be reversed?                                          | 100 state histories with 30 edits each; undo all, redo all, serialize/parse. Browser image before a control edit equals the image after Undo.                       | Passed. History is bounded to 100 commits.                                                                     |
| Are parameter limits real?                                        | 10,000 invalid/non-finite/out-of-range input cases through normalization.                                                                                           | All normalized fields finite and bounded.                                                                      |
| Does reverse inference have a bounded, inspectable outcome?       | Exhaustively recover all 324 distinct structural descriptors. Apply a known target through the actual interface.                                                    | Passed. This is parameter-descriptor inference, not image-based inverse rendering.                             |
| Does the loop close?                                              | Compare pixel RMSE for tick 719 -> 0 with tick 0 -> 1. Wrap change must be <2x the ordinary step.                                                                   | Passed. Exact values in `EFFECTS.json`.                                                                        |
| Do framework tabs show working implementations?                   | Playwright selects React, Vue, Svelte, TypeScript and HTML, waits for that adapter and an active renderer, changes a control, and inspects the actual source block. | All five passed. Native mobile adapters are not advertised.                                                    |
| Do inspection lenses do more than change a label?                 | Playwright checks that normal/phase views change the canvas, and Undo restores the art-direction frame.                                                             | Passed. Lens state is serialized.                                                                              |
| Are keyboard and narrow-screen controls usable?                   | Chromium at 390x844, reduced-motion media emulation, keyboard range adjustment, state-link round trip and overflow check.                                           | Passed in browser emulation. Physical phones, assistive technology and cross-browser checks remain unverified. |
| Is failure handled?                                               | Force static fallback, continue changing configuration, then separately lose/restore WebGL context and compare the paused frame.                                    | Passed. Fallback is explicitly labelled as a static illustration.                                              |
| Does rendering meet the 20ms budget?                              | 3 x 30s RAF sampling after 10s warmup at fixed 1280x720, DPR 1.                                                                                                     | See `PERFORMANCE.json`. Software-renderer results are separate; a hardware GPU remains unverified.             |
| Is the actual visual architecture compelling?                     | Runtime desktop/mobile captures and the live deployment.                                                                                                            | Human acceptance remains pending. Technical checks do not certify aesthetic quality.                           |

## Reference comparison method

- [SPACE TYPE GENERATOR on Behance](https://www.behance.net/gallery/69674423/SPACE-TYPE-GENERATOR-_vcylinder): useful geometric controls and periodic motion. The applicable challenge here is measurable control causality and repeatability.
- [Lusion on Awwwards](https://www.awwwards.com/sites/lusion): one dominant spatial scene and coherent art direction. The applicable challenge here is composition, silhouette and material readability; human judgment is still required.
- [Superdesign library](https://superdesign.dev/library): portal/reveal composition and supporting hierarchy. The applicable challenge here is whether aperture is an understandable action with an observable outcome.
- [Storybook source/documentation](https://storybook.js.org/docs/writing-docs/code-panel): previews and implementation evidence. Here the selected framework actually mounts, and source is imported from the adapter files rather than maintained as an unrelated example string.

These reference pages informed principles. Their live performance was not benchmarked and their assets were not copied.

## Accessibility automation

Four axe-core scans cover desktop, catalogue, mobile and fallback. They report zero automated rule violations. Color contrast remains an incomplete/manual check, particularly where text overlays canvas graphics. This is not a screen-reader or full WCAG conformance certification. Raw results are in `ACCESSIBILITY.json`.

## Raw evidence and reproduction

- `npm test`: five groups covering invalid input, state histories, all 324 descriptors, invalid/version-mismatched state links and bounded, shareable inspection lenses.
- `npm run test:browser`: five actual-browser scenarios, including visible and reversible inspection lenses. Configure the Chromium executable path for the host environment.
- With the dev server on port 4173, run `node scripts/measure-effects.mjs` and `node scripts/benchmark.mjs`. The benchmark needs the server unchanged during sampling; editing source can trigger HMR and invalidate the run.
- `EFFECTS.json` and `PERFORMANCE.json`: raw results and measurement scope. `PERFORMANCE-baseline.json` preserves the slower finite-difference, 131,072-triangle implementation for comparison. The optimized version uses analytic derivatives, precomputed angular terms and 65,536 triangles; report both the changed method and the changed geometry tier rather than attributing the difference to one factor alone.
- `captures/`: runtime images from this implementation, not generated concept artwork.

The measured renderer uses ANGLE/SwiftShader. No performance, visual acceptance, screen-reader audit or physical-device result is inferred from a passing build.

## Measured performance outcome

The optimized implementation reduced the software-renderer p95 range from **866.7–933.3 ms** to **483.3–550.0 ms** across three 30-second runs at 1280x720 / DPR 1. It combines analytic surface derivatives, precomputed angular terms and a reduction from 131,072 to 65,536 triangles. This is an observed improvement, not an isolated attribution to one optimization.

The software run **does not meet** the 20 ms target. A hardware GPU, physical phone and cross-browser performance remain unverified. This is a review build, not a performance-certified release. Automated visual/state correctness does not override these open gates.
