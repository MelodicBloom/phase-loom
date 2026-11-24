import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
  ],
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
await page.goto("http://127.0.0.1:4173/?paused=1");
await page.waitForFunction(() => window.phaseLoom?.ready);
const result = await page.evaluate(async () => {
  const loom = document.querySelector("phase-loom");
  const base = { ...loom.state };
  const gl = loom.canvas.getContext("webgl2");
  const w = loom.canvas.width,
    h = loom.canvas.height;
  const capture = (s) => {
    loom.configure(s);
    loom.engine.render();
    const p = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, p);
    return p;
  };
  const baseline = capture(base);
  const differences = (a, b) => {
    let changed = 0,
      sq = 0;
    for (let i = 0; i < a.length; i += 4) {
      let max = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(a[i + c] - b[i + c]);
        max = Math.max(max, d);
        sq += d * d;
      }
      if (max > 8) changed++;
    }
    return {
      fractionOver8: changed / (w * h),
      rmse: Math.sqrt(sq / (w * h * 3)),
    };
  };
  const controls = {};
  for (const [key, value] of [
    ["aperture", 2],
    ["phase", 8],
    ["ratio", 2],
  ])
    controls[key] = differences(baseline, capture({ ...base, [key]: value }));
  const end = capture({ ...base, tick: 719 }),
    start = capture(base),
    next = capture({ ...base, tick: 1 });
  const loop = {
    wrap: differences(end, start),
    step: differences(start, next),
  };
  // A smaller fixed drawing buffer makes 100 exact replay comparisons practical in software.
  loom.canvas.style.width = "320px";
  loom.canvas.style.height = "180px";
  loom.engine.resize();
  const gw = loom.canvas.width,
    gh = loom.canvas.height;
  const read = (s) => {
    loom.configure(s);
    loom.engine.render();
    const p = new Uint8Array(gw * gh * 4);
    gl.readPixels(0, 0, gw, gh, gl.RGBA, gl.UNSIGNED_BYTE, p);
    return p;
  };
  const fixed = read(base);
  let exact = 0;
  for (let i = 0; i < 100; i++) {
    read({
      ...base,
      aperture: i % 9,
      phase: i % 12,
      ratio: i % 3,
      tick: (i * 7) % 720,
    });
    const restored = read(base);
    if (restored.every((x, j) => x === fixed[j])) exact++;
  }
  return {
    renderer: loom.diagnostics(),
    controlBuffer: { width: w, height: h },
    controls,
    loop,
    pixelReplay: {
      comparisons: 100,
      exactMatches: exact,
      width: gw,
      height: gh,
    },
    scope:
      "readPixels comparison on the same browser, shader and renderer; not cross-GPU identity",
  };
});
writeFileSync("docs/EFFECTS.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (
  Object.values(result.controls).some((x) => x.fractionOver8 < 0.01) ||
  result.pixelReplay.exactMatches !== 100 ||
  result.loop.wrap.rmse > result.loop.step.rmse * 2
)
  process.exitCode = 1;
await browser.close();
