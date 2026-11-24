import "./style.css";
import "./element";
import {
  DEFAULT,
  FIXTURES,
  History,
  normalize,
  parse,
  serialize,
  descriptor,
  infer,
  energy,
  type LoomState,
} from "./core";
import type { PhaseLoomElement } from "./element";

const search = new URLSearchParams(location.search);
const shared = new URLSearchParams(location.hash.slice(1)).get("state");
const initial = shared
  ? parse(shared)
  : (FIXTURES.find((f) => f.id === search.get("fixture"))?.state ?? DEFAULT);
const history = new History(initial);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let playing = !reduced.matches && !search.has("paused");
let sceneVisible = true;
let clock = 0,
  origin = history.state.tick,
  started = performance.now();
let target = FIXTURES[1];
let candidate: ReturnType<typeof infer> | undefined;
let lens = "Art direction";
let catalogue = search.get("view") === "catalogue";
let currentAdapter = "HTML";
let adapterCleanup: (() => void) | undefined;
let adapterToken = 0;
const events: string[] = [];
const $ = <T extends Element = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
const ratioLabels = ["1:1", "3:2", "2:1"];
const button = (id: string, label: string, extra = "") =>
  `<button id="${id}" type="button" ${extra}>${label}</button>`;
$("#app").innerHTML = `
<header><a class="identity" href="/" aria-label="Phase Loom home"><svg viewBox="0 0 56 40" aria-hidden="true"><ellipse cx="20" cy="20" rx="15" ry="13" fill="none" stroke="currentColor"/><ellipse cx="35" cy="20" rx="15" ry="13" fill="none" stroke="currentColor"/></svg><span>PHASE LOOM<small>MELODICBLOOM · OPTICAL INSTRUMENT 001</small></span></a><nav>${button("viewToggle", catalogue ? "← Instrument" : "Component catalogue +")}<a href="https://github.com/MelodicBloom/phase-loom" target="_blank" rel="noreferrer">Source +</a></nav></header>
<main>
<div class="workspace">
<section class="stage" aria-label="Optical sculpture workspace">
 <div class="lenses" role="group" aria-label="Inspection lens">${["Art direction", "Engineering", "Mathematics", "Inquiry"].map((x) => `<button type="button" data-lens="${x}" aria-pressed="${x === lens}">${x}</button>`).join("")}</div>
 <div id="renderMount"><phase-loom></phase-loom></div>
 <div class="orientation"><span id="renderStatus">INITIALIZING</span><span id="phaseStamp">Φ 120°</span></div>
 <div class="wordmark"><span class="eyebrow">FORM, FREQUENCY & FOLD</span><h1>PHASE<span>/</span><br>LOOM</h1><p>A sculpture you can reason with.</p></div>
 <button id="stagePlay" type="button" class="stagePlay" aria-label="Pause sculpture">Pause</button><div class="stageNote"><span class="dot"></span> GLSL ES 3.00 <span>DRAG TO ORBIT · RESET TO RETURN</span></div>
</section>
<aside class="inspector" aria-label="Sculpture parameters">
 <div class="sectionTitle"><span>01 / PARAMETERS</span><span id="fixtureLabel">F03</span></div>
 <label class="parameter" for="aperture"><span>Aperture <output id="apertureValue"></output></span><input id="aperture" type="range" min="0" max="8" step="1"><small>Open the central silhouette</small></label>
 <label class="parameter" for="phase"><span>Phase <output id="phaseValue"></output></span><input id="phase" type="range" min="0" max="11" step="1"><small>Align the lamellae · 30° detents</small></label>
 <label class="parameter" for="ratio"><span>Ratio <output id="ratioValue"></output></span><input id="ratio" type="range" min="0" max="2" step="1"><small>Change periodic fold structure</small></label>
 <div class="fixtureSection"><label for="fixture" class="eyebrow">02 / CANONICAL STUDIES</label><select id="fixture"><option value="" disabled>Custom configuration</option>${FIXTURES.map((f) => `<option value="${f.id}">${f.id} — ${f.name}</option>`).join("")}</select></div>
 <div class="target"><label class="eyebrow" for="target">03 / REVERSE INFERENCE</label><select id="target">${FIXTURES.map((f) => `<option value="${f.id}" ${f.id === target.id ? "selected" : ""}>${f.id} — ${f.name}</option>`).join("")}</select><p>Which configuration produces this target?</p><div class="targetActions">${button("infer", "Inspect candidate +", 'class="primary"')}${button("apply", "Apply", "disabled")}</div><p id="inference" class="readout">Search a finite lattice of 324 configurations.</p></div>
 <div class="tension"><span>CONFIGURATION TENSION</span><output id="energy"></output><div class="meter"><i id="energyBar"></i></div><small>Dimensionless visual metric · not physical energy</small></div>
</aside>
</div>
<section class="transport" aria-label="Playback and history">
 ${button("play", "Ⅱ", 'aria-label="Pause animation" class="play"')}<div class="time"><output id="tick"></output><span>/ 720 TICKS</span></div><input id="timeline" type="range" min="0" max="719" step="1" aria-label="Timeline tick"><div class="history">${button("stepBack", "−1", 'aria-label="Previous tick"')}${button("stepForward", "+1", 'aria-label="Next tick"')}${button("undo", "↶ Undo")}${button("redo", "↷ Redo")}${button("reset", "↺ Reset")}</div>
</section>
<section class="explanation"><div><span class="eyebrow" id="lensLabel">ART DIRECTION / OBSERVE</span><p id="lensText"></p></div><div class="exportActions">${button("share", "Copy state link +")}${button("export", "Export JSON ↓")}${button("capture", "Capture PNG ↓")}</div></section>
<section id="catalogue" ${catalogue ? "" : "hidden"} aria-label="Live component catalogue"><div class="catalogueHeading"><div><span class="eyebrow">LIVE SPECIMEN / 001</span><h2>One engine. Every state.</h2><p>The preview above runs the framework selected below. Source tabs use the actual adapter files.</p></div><span class="badge">SOURCE + RUNTIME</span></div><div class="frameworks" role="tablist" aria-label="Framework">${["HTML", "TypeScript", "React", "Vue", "Svelte"].map((x, i) => `<button role="tab" id="tab-${x}" aria-controls="codePanel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-framework="${x}">${x}</button>`).join("")}</div><div class="sourceScopes" role="group" aria-label="Source section"><button data-source="usage" aria-pressed="true">Adapter</button><button data-source="core" aria-pressed="false">State core</button><button data-source="engine" aria-pressed="false">GLSL renderer</button><button data-source="element" aria-pressed="false">Web Component</button><a href="/registry.json" download="phase-loom-source.json">Download full source ↓</a></div><div class="codeToolbar"><span id="codeLabel">Web Component · local workspace package</span>${button("copyCode", "Copy source")}</div><pre id="codePanel" role="tabpanel" aria-labelledby="tab-HTML" tabindex="0"><code id="sourceCode"></code></pre><details><summary>State contract & event history</summary><div class="stateColumns"><pre id="stateJson"></pre><ol id="events"></ol></div></details><p class="catalogueNote">Framework adapters run the same WebGL2 renderer. This is a source workspace, not a published npm package. Native mobile rendering requires a separate adapter.</p></section>
<details class="method"><summary>Method, constraints & rendering diagnostics <span>+</span></summary><div class="methodGrid"><div><h3>A bounded instrument</h3><p>9 aperture values × 12 phase detents × 3 rational ratios. Playback is a 720-tick periodic deformation. All configuration changes can be undone. Camera orientation is bounded and serialized.</p><h3>What inference means here</h3><p>Exhaustive search compares [aperture/8, cos(phase), sin(phase), ratio/2] using normalized RMSE. It matches a structural parameter descriptor; it does not reconstruct a photograph or simulate physical optics.</p></div><div><h3>Visual tension</h3><p>E = .45(1 − aperture/8) + .175(1 + sin(phase)) + .1 ratio. This is an authored visual metric, not physical energy.</p><pre id="diagnostics">Waiting for the renderer…</pre></div></div></details>
<p id="notice" role="status" aria-live="polite"></p>
</main><footer><span>MELODICBLOOM / EXPERIMENTAL INSTRUMENTS</span><span>REPRODUCIBLE BY CONFIGURATION. REVERSIBLE BY DESIGN.</span></footer>`;
const scene = () => document.querySelector<PhaseLoomElement>("phase-loom");
function notify(text: string) {
  $("#notice").textContent = text;
}
function record(action: string) {
  events.unshift(`${action} · ${serialize(history.state)}`);
  events.length = Math.min(events.length, 20);
  $("#events").replaceChildren(
    ...events.map((x) => {
      const li = document.createElement("li");
      li.textContent = x;
      return li;
    }),
  );
}
function commit(patch: Partial<LoomState>, event: string) {
  history.commit({ ...history.state, ...patch });
  candidate = undefined;
  $("#apply").setAttribute("disabled", "");
  record(event);
  sync();
}
function sync() {
  const s = history.state;
  lens = ["Art direction", "Engineering", "Mathematics", "Inquiry"][s.lens];
  document
    .querySelectorAll<HTMLElement>("[data-lens]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.lens === lens)),
    );
  scene()?.configure(s);
  $("#renderStatus").textContent =
    scene()?.dataset.status === "ready"
      ? "RENDER READY"
      : (scene()?.dataset.status ?? "INITIALIZING").toUpperCase();
  for (const key of ["aperture", "phase", "ratio"] as const)
    $<HTMLInputElement>("#" + key).value = String(s[key]);
  $("#apertureValue").textContent = (0.25 + s.aperture / 16).toFixed(3);
  $("#phaseValue").textContent = `${s.phase * 30}°`;
  $("#ratioValue").textContent = ratioLabels[s.ratio];
  $("#phaseStamp").textContent = `Φ ${s.phase * 30}°`;
  $<HTMLInputElement>("#timeline").value = String(s.tick);
  $("#tick").textContent = String(s.tick).padStart(3, "0");
  const fixture = FIXTURES.find(
    (f) =>
      f.state.aperture === s.aperture &&
      f.state.phase === s.phase &&
      f.state.ratio === s.ratio,
  );
  $("#fixtureLabel").textContent = fixture?.id ?? "CUSTOM";
  $<HTMLSelectElement>("#fixture").value = fixture?.id ?? "";
  const e = energy(s);
  $("#energy").textContent = e.toFixed(3);
  $("#energyBar").style.width = `${e * 100}%`;
  $("#stateJson").textContent = serialize(s);
  $<HTMLButtonElement>("#undo").disabled = !history.past.length;
  $<HTMLButtonElement>("#redo").disabled = !history.future.length;
  $("#stagePlay").textContent = playing ? "Pause" : "Play";
  $("#stagePlay").setAttribute(
    "aria-label",
    playing ? "Pause sculpture" : "Play sculpture",
  );
  $("#play").textContent = playing ? "Ⅱ" : "▷";
  $("#play").setAttribute(
    "aria-label",
    playing ? "Pause animation" : "Play animation",
  );
  $("#lensLabel").textContent = lens.toUpperCase() + " / OBSERVE";
  $("#lensText").textContent = (
    {
      "Art direction":
        "Copper against cobalt. Open the aperture; watch the edges change the light.",
      Engineering:
        "Surface normal inspection: RGB encodes X / Y / Z direction. One mesh, 64 lamellae, one draw call.",
      Mathematics: `Phase = ${s.phase}π/6. Frequency ratio ${ratioLabels[s.ratio]}. Amber marks high sinusoidal phase; blue marks low. White lines show 30° intervals.`,
      Inquiry: `Your structural error is ${Math.sqrt(descriptor(s).reduce((sum, x, i) => sum + (x - descriptor(target.state)[i]) ** 2, 0) / 4).toFixed(3)}. Which variable reduces it? Inspect a candidate for ${target.name}; apply it or undo.`,
    } as Record<string, string>
  )[lens];
  $("#diagnostics").textContent = JSON.stringify(
    scene()?.diagnostics() ?? {},
    null,
    2,
  );
}
function animate(now: number) {
  if (!playing || document.hidden || !sceneVisible) return;
  history.state = {
    ...history.state,
    tick: (origin + Math.floor((now - started) * 0.06)) % 720,
  };
  scene()?.configure(history.state);
  if (Math.floor(now / 150) !== Math.floor((now - 16) / 150)) {
    const tick = history.state.tick;
    $("#tick").textContent = String(tick).padStart(3, "0");
    $<HTMLInputElement>("#timeline").value = String(tick);
  }
  clock = requestAnimationFrame(animate);
}
function setPlaying(value: boolean) {
  playing = value;
  cancelAnimationFrame(clock);
  origin = history.state.tick;
  started = performance.now();
  if (value) clock = requestAnimationFrame(animate);
  sync();
}
function pause() {
  setPlaying(false);
}
for (const key of ["aperture", "phase", "ratio"] as const)
  $<HTMLInputElement>("#" + key).addEventListener("input", (e) => {
    const value = Number((e.target as HTMLInputElement).value);
    pause();
    commit({ [key]: value }, "SET_" + key.toUpperCase());
  });
$<HTMLInputElement>("#timeline").addEventListener("input", (e) => {
  const value = Number((e.target as HTMLInputElement).value);
  pause();
  commit({ tick: value }, "SEEK");
});
$("#stagePlay").addEventListener("click", () => {
  setPlaying(!playing);
  record(playing ? "PLAY" : "PAUSE");
});
$("#play").addEventListener("click", () => {
  setPlaying(!playing);
  record(playing ? "PLAY" : "PAUSE");
});
$("#stepBack").addEventListener("click", () => {
  pause();
  commit(
    {
      tick: normalize({ ...history.state, tick: history.state.tick - 1 }).tick,
    },
    "STEP_BACK",
  );
});
$("#stepForward").addEventListener("click", () => {
  pause();
  commit(
    {
      tick: normalize({ ...history.state, tick: history.state.tick + 1 }).tick,
    },
    "STEP_FORWARD",
  );
});
$("#undo").addEventListener("click", () => {
  pause();
  history.undo();
  record("UNDO");
  sync();
});
$("#redo").addEventListener("click", () => {
  pause();
  history.redo();
  record("REDO");
  sync();
});
$("#reset").addEventListener("click", () => {
  pause();
  commit(DEFAULT, "RESET");
  notify(
    "Returned to F03 · Open Fold. Undo restores your previous configuration.",
  );
});
$<HTMLSelectElement>("#fixture").addEventListener("change", (e) => {
  const id = (e.target as HTMLSelectElement).value;
  pause();
  const f = FIXTURES.find((x) => x.id === id)!;
  commit(f.state, "FIXTURE_" + f.id);
});
$<HTMLSelectElement>("#target").addEventListener("change", (e) => {
  target = FIXTURES.find(
    (x) => x.id === (e.target as HTMLSelectElement).value,
  )!;
  candidate = undefined;
  $("#apply").setAttribute("disabled", "");
  $("#inference").textContent =
    "Target changed. Inspect a candidate before applying.";
  sync();
});
$("#infer").addEventListener("click", () => {
  pause();
  candidate = infer(descriptor(target.state));
  $("#inference").textContent =
    `324 tested · descriptor error ${candidate.error.toFixed(6)}. Candidate: aperture ${candidate.state.aperture}, phase ${candidate.state.phase * 30}°, ratio ${ratioLabels[candidate.state.ratio]}.`;
  $("#apply").removeAttribute("disabled");
  record("INFER");
});
$("#apply").addEventListener("click", () => {
  if (candidate) {
    const next = candidate.state;
    commit(next, "APPLY_CANDIDATE");
    notify(`Applied target ${target.id}. Undo reverses this change.`);
  }
});
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-lens]",
))
  button.addEventListener("click", () => {
    pause();
    const index = [
      "Art direction",
      "Engineering",
      "Mathematics",
      "Inquiry",
    ].indexOf(button.dataset.lens!);
    commit({ lens: index }, "INSPECT_LENS");
    if (index === 1) $<HTMLDetailsElement>(".method").open = true;
    if (index === 3) $("#target").focus();
  });
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify("Copied to clipboard.");
  } catch {
    notify("Clipboard unavailable. The requested text is shown below.");
    $("#catalogue").removeAttribute("hidden");
    $("#sourceCode").textContent = text;
  }
}
$("#share").addEventListener("click", () => {
  pause();
  const url = new URL(location.href);
  url.hash = new URLSearchParams({
    state: serialize(history.state),
  }).toString();
  copy(url.href);
});
function download(content: string, name: string, type = "application/json") {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([content], { type }));
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("#export").addEventListener("click", () =>
  download(serialize(history.state), "phase-loom-state.json"),
);
$("#capture").addEventListener("click", () => {
  pause();
  const png = scene()?.capture();
  if (!png) {
    notify("PNG capture needs an active WebGL2 renderer.");
    return;
  }
  const a = document.createElement("a");
  a.href = png;
  a.download = "phase-loom.png";
  a.click();
});
$("#renderMount").addEventListener("renderstatus", () => sync(), true);
let drag: { x: number; y: number; yaw: number; pitch: number } | undefined;
$("#renderMount").addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") return;
  pause();
  drag = {
    x: e.clientX,
    y: e.clientY,
    yaw: history.state.yaw,
    pitch: history.state.pitch,
  };
  $("#renderMount").setPointerCapture(e.pointerId);
});
$("#renderMount").addEventListener("pointermove", (e) => {
  if (drag)
    scene()?.configure(
      normalize({
        ...history.state,
        yaw: drag.yaw + (e.clientX - drag.x) * 0.2,
        pitch: drag.pitch + (e.clientY - drag.y) * 0.2,
      }),
    );
});
$("#renderMount").addEventListener("pointerup", (e) => {
  if (drag) {
    commit(
      {
        yaw: drag.yaw + (e.clientX - drag.x) * 0.2,
        pitch: drag.pitch + (e.clientY - drag.y) * 0.2,
      },
      "ORBIT",
    );
    drag = undefined;
  }
});
$("#renderMount").addEventListener("pointercancel", () => {
  drag = undefined;
  scene()?.configure(history.state);
});
// Explicit keyboard/touch camera controls avoid a drag-only operation.
const orbit = document.createElement("div");
orbit.className = "orbit";
orbit.setAttribute("aria-label", "Camera orientation");
orbit.setAttribute("role", "group");
orbit.innerHTML =
  '<button aria-label="Orbit left">←</button><button aria-label="Orbit right">→</button><button aria-label="Orbit up">↑</button><button aria-label="Orbit down">↓</button>';
$(".stage").append(orbit);
Array.from(orbit.children).forEach((b, i) =>
  b.addEventListener("click", () => {
    pause();
    commit(
      i < 2
        ? { yaw: history.state.yaw + (i === 0 ? -10 : 10) }
        : { pitch: history.state.pitch + (i === 2 ? -10 : 10) },
      "ORBIT_STEP",
    );
  }),
);
reduced.addEventListener("change", () => {
  if (reduced.matches) {
    pause();
    notify(
      "Reduced motion enabled. Use explicit tick controls or Play to opt in.",
    );
  }
});
document.addEventListener("visibilitychange", () => {
  cancelAnimationFrame(clock);
  if (!document.hidden && playing && sceneVisible) {
    origin = history.state.tick;
    started = performance.now();
    clock = requestAnimationFrame(animate);
  }
});
const visibilityObserver = new IntersectionObserver(
  (entries) => {
    sceneVisible = entries[0].isIntersecting;
    cancelAnimationFrame(clock);
    if (sceneVisible && playing && !document.hidden) {
      origin = history.state.tick;
      started = performance.now();
      clock = requestAnimationFrame(animate);
    }
  },
  { threshold: 0 },
);
visibilityObserver.observe($(".stage"));
const sources = import.meta.glob(
  ["./adapters/*", "./core.ts", "./engine.ts", "./element.ts"],
  { query: "?raw", import: "default" },
) as Record<string, () => Promise<string>>;
const sourcePaths: Record<string, string> = {
  HTML: "./adapters/html.txt",
  TypeScript: "./adapters/native.ts",
  React: "./adapters/react.tsx",
  Vue: "./adapters/vue.ts",
  Svelte: "./adapters/Loom.svelte",
};
async function selectAdapter(name: string) {
  const token = ++adapterToken;
  pause();
  currentAdapter = name;
  const source = await sources[sourcePaths[name]]();
  if (token !== adapterToken) return;
  document
    .querySelectorAll("[data-source]")
    .forEach((x) =>
      x.setAttribute(
        "aria-pressed",
        String((x as HTMLElement).dataset.source === "usage"),
      ),
    );
  $("#sourceCode").textContent = source;
  $("#codeLabel").textContent = `${name} · actual workspace adapter source`;
  const tabs = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-framework]"),
  );
  tabs.forEach((t) => {
    const selected = t.dataset.framework === name;
    t.setAttribute("aria-selected", String(selected));
    t.tabIndex = selected ? 0 : -1;
  });
  $("#codePanel").setAttribute("aria-labelledby", "tab-" + name);
  adapterCleanup?.();
  adapterCleanup = undefined;
  $("#renderMount").replaceChildren();
  let cleanup: () => void;
  if (name === "React") {
    const mod = await import("./adapters/react");
    cleanup = mod.mountReact($("#renderMount"), history.state);
  } else if (name === "Vue") {
    const mod = await import("./adapters/vue");
    cleanup = mod.mountVue($("#renderMount"), history.state);
  } else if (name === "Svelte") {
    const mod = await import("./adapters/svelte");
    cleanup = mod.mountSvelte($("#renderMount"), history.state);
  } else {
    const mod = await import("./adapters/native");
    cleanup = mod.mountNative($("#renderMount"), history.state);
  }
  if (token !== adapterToken) {
    cleanup();
    return;
  }
  adapterCleanup = cleanup;
  $("#renderMount").dataset.adapter = name;
  sync();
  record("ADAPTER_" + name);
}
for (const tab of document.querySelectorAll<HTMLButtonElement>(
  "[data-framework]",
)) {
  tab.addEventListener("click", () => selectAdapter(tab.dataset.framework!));
  tab.addEventListener("keydown", (e) => {
    const tabs = Array.from(
      document.querySelectorAll<HTMLButtonElement>("[data-framework]"),
    );
    const i = tabs.indexOf(tab);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next =
        tabs[
          (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length
        ];
      next.focus();
      selectAdapter(next.dataset.framework!);
    }
  });
}
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-source]"))
  b.addEventListener("click", async () => {
    const part = b.dataset.source!;
    const path =
      part === "usage" ? sourcePaths[currentAdapter] : "./" + part + ".ts";
    const text = await sources[path]();
    $("#sourceCode").textContent = text;
    $("#codeLabel").textContent =
      part === "usage"
        ? currentAdapter + " · adapter source"
        : part + " · complete implementation";
    document
      .querySelectorAll("[data-source]")
      .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });
$("#copyCode").addEventListener("click", () =>
  copy($("#sourceCode").textContent ?? ""),
);
$("#viewToggle").addEventListener("click", () => {
  catalogue = !catalogue;
  $("#catalogue").toggleAttribute("hidden", !catalogue);
  $("#viewToggle").textContent = catalogue
    ? "← Instrument"
    : "Component catalogue +";
  const url = new URL(location.href);
  if (catalogue) url.searchParams.set("view", "catalogue");
  else url.searchParams.delete("view");
  window.history.replaceState(null, "", url);
  if (catalogue) {
    selectAdapter(currentAdapter);
    $("#catalogue").scrollIntoView({
      behavior: reduced.matches ? "instant" : "smooth",
      block: "start",
    });
  }
});
if (catalogue) selectAdapter("HTML");
sync();
if (playing) clock = requestAnimationFrame(animate);
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(clock);
  visibilityObserver.disconnect();
  adapterCleanup?.();
});
// Read-only inspection surface used by deterministic browser checks.
Object.defineProperty(window, "phaseLoom", {
  value: {
    get state() {
      return { ...history.state };
    },
    get ready() {
      return scene()?.ready ?? false;
    },
    get playing() {
      return playing;
    },
    diagnostics: () => scene()?.diagnostics(),
  },
  writable: false,
});
