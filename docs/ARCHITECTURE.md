# Contract and architecture

## Approved direction

One folded optical sculpture dominates the viewport, with warm copper/cool cobalt studio reflections, a warm near-black ground, editorial typography, citron control accents, a narrow desktop inspector and a vertically arranged mobile interface. The implementation is parametric geometry, not a generated image texture. Visual parity with the approved concept is subject to human review.

## Ownership and responsibilities

- `core.ts`: legal configuration, normalization, history, fixtures, serialization, structural descriptor search and visual metric. No DOM or rendering dependencies.
- `engine.ts`: one Three.js WebGL2 renderer, one indexed mesh, custom GLSL ES 3.00 vertex/fragment programs. Vertex deformation derives from parameters and tick. Surface derivatives are analytic; fixed sine/cosine terms are precomputed into vertex attributes. This reduces repeated transcendental work and avoids sampling the surface repeatedly to estimate a normal. The mesh uses 65,536 triangles in the measured quality tier. Its surface equation is exposed in the catalogue.
- `element.ts`: mount/update/capture/dispose, resize observation, rendering readiness, context loss/recovery and static unsupported-renderer fallback. It renders only on invalidation. Three.js handles GL resource restoration; the element restores uniforms and invalidates after the context-restored event.
- `main.ts`: one playback clock, accessible DOM controls, bounded interaction history, event log and catalogue orchestration. Continuous camera drag previews are transient; releasing commits one history action. Touch gets explicit orbit buttons instead of intercepting vertical scrolling.
- `adapters`: working HTML/custom-element, TypeScript, React, Vue and Svelte bindings. Framework packages load only when their tab is chosen. Removing a preview releases its renderer resources.
- `scripts/build-registry.mjs`: builds a complete, hash-addressed source manifest from real implementation files before deployment. It does not translate source between frameworks.

## Geometry

Right-handed object coordinates. The central path is a closed, three-lobed perturbation of a circle in XY with periodic Z displacement. A transverse band rotates by three half twists plus a periodic modulation using the selected integer frequency pair. Sixty-four adjacent strips form the lamellae. Smooth geometric normals with an authored bevel perturbation preserve the macro-surface reflection. Both sides are shaded. The model transform is an explicit base orientation plus bounded camera-orbit angles. Perspective framing accounts for both viewport width and height.

This is an artistic optical instrument. The Fresnel/GGX-inspired material, studio reflection lobes and radial interior darkening are not a calibrated light-transport solver, a thin-film model or measured metal.

## State and fixtures

Aperture is an integer 0..8, displayed as 1/4 + index/16. Phase is an integer 0..11 displayed as 30-degree detents. Ratio index 0..2 selects 1:1, 3:2 or 2:1. Tick is an integer 0..719. Yaw is bounded to -60..60 degrees and pitch to -45..45 degrees. Inspection lens is an integer 0..3 and is serialized with the view. Non-finite or invalid values fall back to documented defaults; phase/tick wrap and bounded magnitudes clamp. There is no Math.random input.

- F01 Closed Weave: aperture 0, phase 0, ratio 0, tick 0.
- F02 Counterphase: aperture 4, phase 6, ratio 2, tick 0.
- F03 Open Fold: aperture 8, phase 4, ratio 1, tick 0.

History retains at most 100 committed configurations. Playback advances the current tick without adding a history record for each frame. Pause/seek/parameter actions operate on the current integer tick. Undo restores the entire saved configuration. State links use a versioned serialized configuration; old/invalid schema versions fall back to F03. Renderer size, device, shader version and dependency version are additional screenshot-fixture identity fields.

## Bounded energetic lenses

- Art direction: sculptural form, light and surface.
- Engineering: an actual RGB surface-normal view, plus mesh/resource diagnostics. RGB maps world-space X/Y/Z normal components from -1..1 into 0..1.
- Mathematics: an actual sinusoidal phase-band view. Amber denotes high and blue low phase; white angular marks divide the cycle into 30-degree intervals.
- Inquiry: a target question with current structural error, focus on the target selector, inspectable candidate and reversible application.

These are rule-based inspection modes, not generative agents. No runtime language model or API key is needed.

Reverse inference searches all 324 configurations at tick/camera zero. It compares `[aperture/8, cos(phase), sin(phase), ratio/2]` using normalized RMSE and stable first-candidate tie-breaking. The UI reports the candidate and error before application. This is structural parameter inference, not image reconstruction or an optical inverse-rendering solver.

The dimensionless visual configuration metric is `E = .45(1 - aperture/8) + .175(1 + sin(phase)) + .1 ratioIndex`. It is not physical energy. Lens selection does not mutate geometric parameters. The inspection view is a bounded, serialized state change and can be undone. The normal/phase render modes are verified to change the image; undo restores the original image.

## Interaction/fallback lifecycle

Ready, unsupported and context-lost are explicit renderer states. Reduced motion starts paused and stops playback if the preference changes. The user can explicitly opt into playback or step/seek. Hidden documents and offscreen stages suspend the clock without wall-clock catch-up. A visible stage-level play control supplements the lower transport, especially on mobile. Context restoration keeps the paused state. Unsupported rendering displays a clearly labelled static SVG study; controls and JSON configuration remain functional. It does not pretend to be a shader-rendered scene.

## Acceptance

Correctness, actual control-to-image effect, reversible screenshots, framework adapter behavior, keyboard/mobile operation, fallback behavior and context restoration must pass automated checks. Hardware-GPU p95 <=20ms at fixed 1280x720 remains a separate measurement gate. Human visual acceptance remains pending. Do not promote an automated technical pass into an award-level or aesthetic superiority claim.
