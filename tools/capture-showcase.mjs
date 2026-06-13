/**
 * One-off screenshots for review: cosmic intro + homepage (geo mocked for weather card).
 * Prerequisite: static server on public/, e.g. npx serve public -l 4180
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '.cosmic-samples');
const base = process.env.SHOWCASE_BASE || 'http://127.0.0.1:4180';

mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  geolocation: { latitude: 28.228, longitude: 112.938 },
  permissions: ['geolocation']
});
const page = await ctx.newPage();

// Cosmic intro — start / mid / end
for (const [name, progress] of [
  ['show-cosmic-start', 0],
  ['show-cosmic-mid', 0.5],
  ['show-cosmic-end', 0.98]
]) {
  await page.goto(`${base}/cosmic-intro/`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2800);
  await page.evaluate((p) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, p * max);
  }, progress);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(out, `${name}.png`), type: 'png' });
  console.log('wrote', name + '.png');
}

// Homepage — wait for possible weather card in sidebar
await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: join(out, 'show-home.png'), type: 'png' });
console.log('wrote show-home.png');

await browser.close();
