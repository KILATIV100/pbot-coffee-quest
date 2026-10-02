import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
await mkdir("qa-3d", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://127.0.0.1:4317");
await page.getByRole("button", { name: "Грати", exact: true }).click();
// Physical key events, including airborne second jump and camera-relative lateral input.
const start = await page.evaluate(() => __PBOT3D__.position());
await page.keyboard.down("KeyD");
await page.waitForFunction(x => __PBOT3D__.position().x < x - .6, start.x, {timeout: 20000});
await page.keyboard.up("KeyD");
assert.ok((await page.evaluate(() => __PBOT3D__.position())).x < start.x - 0.5);
await page.keyboard.press("Space");
await page.waitForFunction(() => __PBOT3D__.position().y > 1.5, null, {timeout: 20000});
const first = await page.evaluate(() => __PBOT3D__.position().y);
await page.keyboard.press("Space");
await page.waitForFunction(y => __PBOT3D__.position().y > y + .4, first, {timeout: 20000});
assert.ok((await page.evaluate(() => __PBOT3D__.position().y)) > first + 0.4);
await page.waitForFunction(() => __PBOT3D__.position().y < .95, null, {timeout: 20000});
await page.keyboard.down("KeyC");
await page.waitForFunction(() => __PBOT3D__.position().y < .7, null, {timeout: 20000});
const crouch = await page.evaluate(() => __PBOT3D__.position().y);
await page.keyboard.up("KeyC");
await page.waitForFunction(() => __PBOT3D__.position().y > .8, null, {timeout: 20000});
assert.ok((await page.evaluate(() => __PBOT3D__.position().y)) > crouch + 0.15);
const sample = await page.evaluate(async () => {
  const gaps = [];
  let last = performance.now();
  await new Promise((resolve) => {
    function frame(t) {
      gaps.push(t - last);
      last = t;
      if (gaps.length < 180) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
  gaps.sort((a, b) => a - b);
  return { p50FrameMs: gaps[90], p95FrameMs: gaps[171], ...__PBOT3D__.metrics };
});
await writeFile(
  "qa-3d/runtime-metrics.json",
  JSON.stringify(
    {
      sample,
      errors,
      note: "Local desktop Chromium, 180 real requestAnimationFrame intervals after warmup. Not physical mobile GPU or network benchmark.",
    },
    null,
    2,
  ),
);
assert.deepEqual(errors, []);
await page.close();
const blocked = await browser.newPage();
await blocked.addInitScript(() => {
  Storage.prototype.setItem = function () {
    throw Error("storage blocked");
  };
});
await blocked.goto("http://127.0.0.1:4317");
await blocked.getByRole("button", { name: "Грати", exact: true }).click();
assert.ok(await blocked.locator("#toast").textContent());
await blocked.close();
const fallback = await browser.newPage();
await fallback.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    if (type.startsWith("webgl")) return null;
    return original.call(this, type, ...args);
  };
});
await fallback.goto("http://127.0.0.1:4317");
await fallback.locator("#fallback").waitFor({ state: "visible" });
// Context-loss fallback screenshots are captured in both engines by playthrough.mjs.
assert.equal(await fallback.getByRole("button", {name: "Спробувати знову"}).isVisible(), true);
await browser.close();
console.log(sample);
