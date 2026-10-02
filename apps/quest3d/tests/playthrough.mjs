import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const out = process.env.QA_OUT || "qa-3d";
await mkdir(out, { recursive: true });
const results = [];
for (const name of (process.env.BROWSERS || "chromium,webkit").split(",")) {
  const browser = await { chromium, webkit }[name].launch({
    headless: true,
    ...(process.env[name.toUpperCase() + "_PATH"]
      ? { executablePath: process.env[name.toUpperCase() + "_PATH"] }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://127.0.0.1:4317");
  await page.getByRole("button", { name: "Грати", exact: true }).click();
  await page.waitForFunction(() => window.__PBOT3D__);
  await page.evaluate(() =>
    localStorage.setItem(
      "pbot-brovary-final-v1",
      '{"selected":"hero","tokens":77}',
    ),
  );
  const old = await page.evaluate(() =>
    localStorage.getItem("pbot-brovary-final-v1"),
  );
  async function step(n = 1) {
    await page.evaluate((n) => __PBOT3D__.advance(n), n);
  }
  async function state() {
    return page.evaluate(() => ({
      s: __PBOT3D__.state,
      p: __PBOT3D__.position(),
    }));
  }
  async function go(x, z, { jump = false } = {}) {
    const r = await page.evaluate(
      ({ x, z, jump }) => {
        const qa = __PBOT3D__;
        qa.keys.clear();
        let i = 0;
        for (; i < 1800; i++) {
          const p = qa.position(),
            dx = x - p.x,
            dz = z - p.z;
          if (Math.hypot(dx, dz) < 0.22) break;
          qa.keys.clear();
          if (Math.abs(dx) > 0.12) qa.input(dx > 0 ? "KeyA" : "KeyD", true);
          if (Math.abs(dz) > 0.12) qa.input(dz > 0 ? "KeyW" : "KeyS", true);
          if (jump && (i === 0 || i === 24 || i % 90 === 0 || i % 90 === 24)) {
            qa.input("Space", false);
            qa.input("Space", true);
          }
          qa.input("KeyE", false);
          qa.input("KeyE", true);
          qa.advance(1);
        }
        qa.keys.clear();
        qa.advance(12);
        qa.renderFrame();
        return { i, p: qa.position(), s: qa.state };
      },
      { x, z, jump },
    );
    assert.ok(r.i < 1800, `stuck ${x},${z}: ${JSON.stringify(r.p)}`);
    return r;
  }
  async function talk(text) {
    await page.keyboard.press("KeyF");
    await page.getByRole("button", { name: text, exact: true }).click();
  }
  await step(30);
  await page.screenshot({ path: `${out}/${name}-01-street.png` });
  await go(-4, 5);
  await talk("Допоможу");
  for (const z of [9, 10.8, 12.6, 14.4, 16.2, 18, 19.8, 21.6]) await go(0, z);
  assert.ok((await state()).s.beans.length >= 8);
  await go(-4, 5);
  await talk("Передати зерна");
  await go(4, 25);
  await talk("Знайду фрагменти");
  for (const [x, z] of [
    [-2, 31],
    [2, 35],
    [0, 39],
  ])
    await go(x, z);
  assert.equal((await state()).s.q.shards.length, 3);
  await page.screenshot({ path: `${out}/${name}-02-bridge.png` });
  await go(4, 25);
  await talk("Передати фрагменти");
  await go(-4, 48);
  await talk("Заберу посилку");
  await go(1.7, 50, { jump: true });
  await go(3.8, 51.7, { jump: true });
  await go(5, 54, { jump: true });
  await go(4.5, 55, { jump: true });
  await step(80);
  const parcel = await state();
  assert.equal(parcel.s.q.parcel, true, JSON.stringify(parcel));
  await page.screenshot({ path: `${out}/${name}-03-parcel.png` });
  await go(0, 48);
  await go(-4, 48);
  await talk("Передати посилку");
  await go(0, 68);
  await talk("Відновити сигнал");
  await page.reload();
  await page.getByRole("button", { name: "Грати", exact: true }).click();
  assert.equal((await state()).s.q.phase, 7);
  await go(0, 86);
  await talk("Завершити розділ");
  assert.equal((await state()).s.complete, true);
  await page.screenshot({ path: `${out}/${name}-04-complete.png` });
  assert.equal(
    await page.evaluate(() => localStorage.getItem("pbot-brovary-final-v1")),
    old,
  );
  assert.deepEqual(errors, []);
  results.push({
    browser: name,
    completed: true,
    ...(await state()),
    metrics: await page.evaluate(() => __PBOT3D__.metrics),
  });
  await page.getByRole("button", { name: "Повернутися", exact: true }).click();
  await page.getByRole("button", { name: "Ⅱ Меню", exact: true }).click();
  await page
    .getByRole("button", { name: "Почати главу знову", exact: true })
    .click();
  await page.getByRole("button", { name: "Почати", exact: true }).click();
  assert.equal((await state()).s.complete, false);
  assert.equal((await state()).s.q.phase, 0);
  // Context loss with menu open must expose the fallback above all modal UI.
  await page.getByRole("button", { name: "Ⅱ Меню", exact: true }).click();
  await page.evaluate(() =>
    document
      .querySelector("canvas")
      .dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
  );
  assert.equal(await page.locator("dialog").evaluate((d) => d.open), false);
  assert.equal(await page.locator("#fallback").isVisible(), true);
  await page.keyboard.press("KeyJ");
  assert.equal(await page.locator("dialog").evaluate((d) => d.open), false);
  await page.screenshot({ path: `${out}/${name}-fallback.png` });
  const mobile = await browser.newPage({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto("http://127.0.0.1:4317");
  await mobile.getByRole("button", { name: "Грати", exact: true }).click();
  await mobile
    .locator('[data-key="KeyW"]')
    .dispatchEvent("pointerdown", { pointerId: 1 });
  await mobile.waitForFunction(() => __PBOT3D__.position().z > 2, null, {timeout: 20000});
  await mobile
    .locator('[data-key="KeyW"]')
    .dispatchEvent("pointerup", { pointerId: 1 });
  assert.ok((await mobile.evaluate(() => __PBOT3D__.position().z)) > 2);
  await mobile.screenshot({ path: `${out}/${name}-mobile-emulation.png` });
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.screenshot({ path: `${out}/${name}-portrait-emulation.png` });
  await browser.close();
}
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
