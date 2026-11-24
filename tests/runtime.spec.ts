import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";

const ready = async (page: any) => {
  await page.waitForFunction(
    () =>
      document.querySelector("phase-loom")?.getAttribute("data-status") ===
      "ready",
  );
};
test("renders the sculpture and primary controls have reversible visible outcomes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/?paused=1&fixture=F03");
  await ready(page);
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  const initial = await page.evaluate(() =>
    JSON.stringify((window as any).phaseLoom.state),
  );
  const before = await page.locator("canvas").screenshot();
  await page.locator("#aperture").fill("2");
  const after = await page.locator("canvas").screenshot();
  expect(Buffer.compare(before, after)).not.toBe(0);
  await page.getByRole("button", { name: "↶ Undo", exact: true }).click();
  expect(
    await page.evaluate(() => JSON.stringify((window as any).phaseLoom.state)),
  ).toBe(initial);
  const restored = await page.locator("canvas").screenshot();
  expect(Buffer.compare(before, restored)).toBe(0);
  await page.locator("#target").selectOption("F02");
  await page.locator("#infer").click();
  await expect(page.locator("#inference")).toContainText("324 tested");
  await page.locator("#apply").click();
  expect(await page.evaluate(() => (window as any).phaseLoom.state.phase)).toBe(
    6,
  );
  await page.locator("#timeline").fill("180");
  await page.locator("#reset").click();
  await expect(page.locator("#timeline")).toHaveValue("0");
  expect(errors).toEqual([]);
});
test("all framework tabs mount a real renderer and show their source", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?paused=1&view=catalogue");
  await ready(page);
  for (const name of ["React", "Vue", "Svelte", "TypeScript", "HTML"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.locator("#renderMount")).toHaveAttribute(
      "data-adapter",
      name,
    );
    await ready(page);
    await expect(page.locator("phase-loom")).toHaveCount(1);
    await expect(page.locator("#codeLabel")).toContainText(name);
    expect(
      (await page.locator("#sourceCode").textContent())!.length,
    ).toBeGreaterThan(100);
    await page.locator("#aperture").fill("3");
    expect(
      await page.evaluate(
        () => (document.querySelector("phase-loom") as any).state.aperture,
      ),
    ).toBe(3);
  }
  expect(errors).toEqual([]);
});
test("mobile keyboard, reduced motion, share state and unsupported fallback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await ready(page);
  expect(await page.evaluate(() => (window as any).phaseLoom.playing)).toBe(
    false,
  );
  await page.locator("#phase").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#phase")).toHaveValue("5");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  const serialized = await page.evaluate(() =>
    JSON.stringify({ v: 1, ...(window as any).phaseLoom.state }),
  );
  await page.goto("/?paused=1#" + new URLSearchParams({ state: serialized }));
  await ready(page);
  await expect(page.locator("#phase")).toHaveValue("5");
  await page.goto("/?fallback=1&paused=1");
  await expect(page.locator(".fallback")).toBeVisible();
  await page.locator("#aperture").fill("1");
  await expect(page.locator("#apertureValue")).toHaveText("0.313");
});
test("context loss restores the same paused state and frame", async ({
  page,
}) => {
  await page.goto("/?paused=1");
  await ready(page);
  const before = await page.locator("canvas").screenshot();
  await page.evaluate(() => {
    const gl = document.querySelector("canvas")!.getContext("webgl2")!;
    (window as any).loss = gl.getExtension("WEBGL_lose_context");
    (window as any).loss.loseContext();
  });
  await expect(page.locator("phase-loom")).toHaveAttribute(
    "data-status",
    "context-lost",
  );
  expect(
    await page.evaluate(() =>
      (document.querySelector("phase-loom") as any).capture(),
    ),
  ).toBeUndefined();
  await page.evaluate(() => (window as any).loss.restoreContext());
  await ready(page);
  const after = await page.locator("canvas").screenshot();
  expect(Buffer.compare(before, after)).toBe(0);
});

test("inspection lenses change the rendered evidence and are reversible", async ({
  page,
}) => {
  await page.goto("/?paused=1");
  await ready(page);
  const art = await page.locator("canvas").screenshot();
  await page.getByRole("button", { name: "Engineering", exact: true }).click();
  expect(await page.evaluate(() => (window as any).phaseLoom.state.lens)).toBe(
    1,
  );
  const normal = await page.locator("canvas").screenshot();
  expect(Buffer.compare(art, normal)).not.toBe(0);
  await page.locator("#undo").click();
  expect(Buffer.compare(art, await page.locator("canvas").screenshot())).toBe(
    0,
  );
  await page.getByRole("button", { name: "Mathematics", exact: true }).click();
  await expect(page.locator("#lensText")).toContainText("30° intervals");
  const math = await page.locator("canvas").screenshot();
  expect(Buffer.compare(art, math)).not.toBe(0);
});
