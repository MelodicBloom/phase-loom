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
const result = await page.evaluate(async () => {
  const { mountLoom } = await import("/src/engine.ts");
  const { DEFAULT } = await import("/src/core.ts");
  document.querySelector("phase-loom")?.remove();
  document.body.innerHTML =
    '<canvas style="display:block;width:1280px;height:720px"></canvas>';
  const canvas = document.querySelector("canvas");
  const engine = mountLoom(canvas, DEFAULT);
  let tick = 0;
  const run = (ms) =>
    new Promise((resolve) => {
      const data = [];
      let start = performance.now(),
        previous = start;
      const frame = (now) => {
        engine.update({ ...DEFAULT, tick: tick++ % 720 });
        engine.render();
        data.push(now - previous);
        previous = now;
        if (now - start < ms) requestAnimationFrame(frame);
        else resolve(data);
      };
      requestAnimationFrame(frame);
    });
  await run(10000);
  const runs = [];
  for (let n = 0; n < 3; n++) {
    const values = await run(30000);
    values.shift();
    values.sort((a, b) => a - b);
    const q = (p) =>
      values[Math.min(values.length - 1, Math.floor(values.length * p))];
    runs.push({
      samples: values.length,
      p50: q(0.5),
      p95: q(0.95),
      p99: q(0.99),
      fractionOver25: values.filter((x) => x > 25).length / values.length,
    });
  }
  const diagnostics = engine.info();
  engine.dispose();
  return {
    protocol:
      "3 x 30s RAF intervals after 10s warmup; fixed 1280x720 drawing buffer, DPR 1; animated tick",
    diagnostics,
    runs,
    gate: "p95 <=20ms on a hardware GPU; software is reported separately",
    hardwareGate: "UNVERIFIED: this environment uses software rendering",
  };
});
writeFileSync("docs/PERFORMANCE.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
