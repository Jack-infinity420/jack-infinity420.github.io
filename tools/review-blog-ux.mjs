import { createReadStream } from 'node:fs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(repoRoot, 'public');
const outRoot = path.join(repoRoot, 'devshots', `blog-ux-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const port = Number(process.env.PORT || 4173);
const base = `http://127.0.0.1:${port}/blog/`;

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff'],
  ['.ttf', 'font/ttf']
]);

mkdirSync(outRoot, { recursive: true });

function resolvePublicPath(url = '/') {
  let pathname = decodeURIComponent(url.split('?')[0]);
  if (pathname === '/blog' || pathname === '/blog/') pathname = '/';
  if (pathname.startsWith('/blog/')) pathname = pathname.slice('/blog'.length);
  pathname = pathname.replace(/^\/+/, '');
  if (!pathname || pathname.endsWith('/')) pathname += 'index.html';

  const filePath = path.resolve(publicRoot, pathname);
  return filePath.startsWith(publicRoot) ? filePath : null;
}

async function sendFile(res, filePath, statusCode = 200) {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) throw new Error('Not a file');

  res.writeHead(statusCode, {
    'content-length': fileStat.size,
    'content-type': mime.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(res);
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    const filePath = resolvePublicPath(req.url);
    if (!filePath) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    try {
      await sendFile(res, filePath);
    } catch {
      try {
        await sendFile(res, path.join(publicRoot, '404.html'), 404);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  });

  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function collectLayout(page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elements = [...document.querySelectorAll('body *')];
    const overflow = elements
      .map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          cls: el.className && typeof el.className === 'string' ? el.className : '',
          text: (el.textContent || '').trim().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })
      .filter(item => item.width > 1 && item.height > 1 && (item.left < -2 || item.right > viewportWidth + 2))
      .slice(0, 30);

    const rectFor = selector => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        selector,
        text: (el.textContent || '').trim().slice(0, 120),
        rect: {
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        color: style.color,
        background: style.backgroundColor
      };
    };

    return {
      title: document.title,
      url: location.href,
      viewport: { width: viewportWidth, height: viewportHeight },
      scrollHeight: document.documentElement.scrollHeight,
      bodyWidth: document.body.scrollWidth,
      viewportWidth,
      overflow,
      samples: [
        rectFor('#page-header'),
        rectFor('#site-title'),
        rectFor('#site-subtitle'),
        rectFor('#recent-posts .recent-post-item'),
        rectFor('#recent-posts .article-title'),
        rectFor('#article-container'),
        rectFor('#article-container p'),
        rectFor('#post-info .post-title'),
        rectFor('.card-weather'),
        rectFor('.weather-mobile-bar')
      ].filter(Boolean)
    };
  });
}

async function runCase(context, item) {
  const page = await context.newPage();
  const consoleMessages = [];
  const failedRequests = [];
  const requestUrls = [];

  page.on('console', msg => {
    const type = msg.type();
    if (['error', 'warning'].includes(type)) {
      consoleMessages.push({ type, text: msg.text().slice(0, 300) });
    }
  });

  page.on('request', req => {
    const url = req.url();
    if (!url.startsWith(base)) requestUrls.push(url);
  });

  page.on('requestfailed', req => {
    failedRequests.push({
      url: req.url(),
      failure: req.failure()?.errorText || ''
    });
  });

  await page.setViewportSize(item.viewport);
  await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('load', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(item.wait || 1800);

  for (const [shotName, scrollY] of item.shots) {
    if (scrollY !== null) {
      await page.evaluate(y => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(500);
    }
    const file = path.join(outRoot, `${item.name}-${shotName}.png`);
    await page.screenshot({ path: file, fullPage: false });
  }

  const layout = await collectLayout(page);
  await page.close();

  return {
    name: item.name,
    url: item.url,
    viewport: item.viewport,
    layout,
    consoleMessages,
    failedRequests,
    externalRequests: [...new Set(requestUrls)].slice(0, 50)
  };
}

const server = await startServer();

try {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block'
  });
  await context.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('blog_location', JSON.stringify({
      province: '\u6e56\u5357',
      city: '\u957f\u6c99',
      country: '\u4e2d\u56fd',
      _ts: now
    }));
    localStorage.setItem('blog_weather_\u957f\u6c99', JSON.stringify({
      type: 'cloudy',
      temp: '28',
      desc: 'Cloudy',
      icon: '\u2601\ufe0f',
      _ts: now
    }));
    localStorage.setItem('blog_poem_cache', JSON.stringify({
      content: '\u72ec\u7acb\u5bd2\u79cb\uff0c\u6e58\u6c5f\u5317\u53bb\uff0c\u6a58\u5b50\u6d32\u5934',
      _ts: now
    }));
  });

  const cases = [
    {
      name: 'desktop-home',
      url: base,
      viewport: { width: 1440, height: 960 },
      shots: [['top', 0], ['posts', 620]]
    },
    {
      name: 'desktop-post',
      url: `${base}posts/4daed45e.html`,
      viewport: { width: 1440, height: 960 },
      shots: [['top', 0], ['reading', 620], ['mid', 1500]]
    },
    {
      name: 'tablet-home',
      url: base,
      viewport: { width: 820, height: 1180 },
      shots: [['top', 0], ['posts', 520]]
    },
    {
      name: 'mobile-home',
      url: base,
      viewport: { width: 390, height: 844 },
      shots: [['top', 0], ['posts', 420], ['later-posts', 980]]
    },
    {
      name: 'mobile-post',
      url: `${base}posts/4daed45e.html`,
      viewport: { width: 390, height: 844 },
      shots: [['top', 0], ['reading', 420], ['mid', 1200]]
    }
  ];

  const results = [];
  for (const item of cases) {
    results.push(await runCase(context, item));
  }

  await browser.close();
  writeFileSync(path.join(outRoot, 'audit.json'), JSON.stringify({ base, results }, null, 2), 'utf8');
  console.log(outRoot);
} finally {
  await new Promise(resolve => server.close(resolve));
}
