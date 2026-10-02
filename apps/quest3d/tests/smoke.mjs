import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", console.error);
page.on("console", (m) => {
  if (m.type() === "error") console.error(m.text());
});
await page.goto("http://127.0.0.1:4317");
await page.getByRole("button", { name: "Грати", exact: true }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: "qa-3d/first-playable.png" });
console.log(
  await page.evaluate(() => ({
    pos: __PBOT3D__.position(),
    metrics: __PBOT3D__.metrics,
  })),
);
await browser.close();
