import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const out = process.env.CAPTURE_OUT || "qa-visual-v2/final";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: out, size: { width: 1280, height: 720 } },
});
const page = await context.newPage(),
  errors = [],
  events = [];
page.on("pageerror", (e) => errors.push(String(e)));
const start = Date.now();
const event = (name) =>
  events.push({ name, seconds: (Date.now() - start) / 1000 });
async function hold(code, ms) {
  await page.keyboard.down(code);
  await page.waitForTimeout(ms);
  await page.keyboard.up(code);
}
await page.goto("http://127.0.0.1:4317");
await page.getByRole("button", { name: "Грати", exact: true }).click();
event("idle");
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/overview.png` });
event("run toward coffee");
await hold("KeyW", 700);
await hold("KeyD", 620);
await page.waitForTimeout(300);
await page.keyboard.press("KeyF");
await page.getByRole("button", { name: "Допоможу", exact: true }).click();
event("quest accepted");
await page.waitForTimeout(700);
event("run turn collect");
await hold("KeyA", 620);
await hold("KeyW", 880);
await page.waitForTimeout(250);
await hold("KeyD", 200);
await hold("KeyW", 200);
await page.waitForTimeout(250);
event("jump");
await page.keyboard.press("Space");
await page.waitForTimeout(230);
event("double jump");
await page.keyboard.press("Space");
await page.waitForTimeout(260);
await page.screenshot({ path: `${out}/jump.png` });
await page.waitForTimeout(1200);
event("landing");
await page.waitForTimeout(600);
await hold("KeyS", 350);
await page.waitForTimeout(350);
event("turn and idle");
await hold("KeyW", 100);
await page.waitForTimeout(300);
event("orbit");
await page.mouse.move(580, 390);
await page.mouse.down();
await page.mouse.move(970, 390, { steps: 45 });
await page.mouse.up();
await page.waitForTimeout(2200);
await page.screenshot({ path: `${out}/character.png` });
await page.keyboard.press("KeyE");
await page.waitForTimeout(3400);
event("end");
const metrics = await page.evaluate(() => __PBOT3D__.metrics);
const video = page.video();
await context.close();
await video.saveAs(`${out}/gameplay.webm`);
const mobile = await browser.newPage({
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true,
});
await mobile.goto("http://127.0.0.1:4317");
await mobile.getByRole("button", { name: "Грати", exact: true }).click();
await mobile.waitForTimeout(900);
await mobile.screenshot({ path: `${out}/touch.png` });
await browser.close();
await writeFile(
  `${out}/capture.json`,
  JSON.stringify(
    {
      events,
      errors,
      metrics,
      note: "Actual browser video. Ordinary keyboard/pointer input, no teleport or sped-up simulation.",
    },
    null,
    2,
  ),
);
if (errors.length) throw Error(errors.join("\n"));
