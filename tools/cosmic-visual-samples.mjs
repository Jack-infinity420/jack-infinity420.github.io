/**
 * Samples /cosmic-intro/ at several scroll progress values for manual continuity review.
 * Usage: npx hexo server (port 4000) then: node tools/cosmic-visual-samples.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', '.cosmic-samples');
const base = process.env.COSMIC_BASE || 'http://127.0.0.1:4000/cosmic-intro/';
const progresses = [0, 0.08, 0.18, 0.32, 0.5, 0.72, 0.88, 0.98];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(base, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(2500);

for (let i = 0; i < progresses.length; i++) {
  const p = progresses[i];
  await page.evaluate((progress) => {
    const max = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    window.scrollTo(0, progress * max);
  }, p);
  await page.waitForTimeout(900);
  const path = join(outDir, `p${String(Math.round(p * 100)).padStart(3, '0')}.png`);
  await page.screenshot({ path, type: 'png' });
  console.log('wrote', path);
}

await browser.close();
console.log('Done. Open .cosmic-samples/*.png to inspect frames.');
