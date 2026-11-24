import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const results = [];
for (const [name, path, width] of [
  ["desktop", "/?paused=1", 1440],
  ["catalogue", "/?paused=1&view=catalogue", 1440],
  ["mobile", "/?paused=1", 390],
  ["fallback", "/?paused=1&fallback=1", 390],
]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://127.0.0.1:4173" + path);
  await page.waitForFunction(() =>
    ["ready", "unsupported"].includes(
      document.querySelector("phase-loom")?.dataset.status,
    ),
  );
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  results.push({
    name,
    violations: result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
    passes: result.passes.length,
    incomplete: result.incomplete.map((v) => v.id),
  });
}
writeFileSync("docs/ACCESSIBILITY.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => r.violations.length)) process.exitCode = 1;
await browser.close();
