const { chromium } = require('../apps/web/node_modules/@playwright/test');
const fs = require('node:fs');
async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
  fs.mkdirSync('docs/screenshots', { recursive: true });
  for (const [name, path, width, height] of [
    ['home-desktop', '/', 1440, 1000],
    ['product-desktop', '/product/amd-ryzen-7-9800x3d', 1440, 1000],
    ['home-mobile', '/', 390, 844],
    ['product-mobile', '/product/amd-ryzen-7-9800x3d', 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
  }
  await browser.close();
  console.log('Captured four demo screenshots in docs/screenshots.');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
