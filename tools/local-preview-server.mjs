import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const port = Number(process.env.PORT || 4100);

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

function resolvePublicPath(url = '/') {
  let pathname = decodeURIComponent(url.split('?')[0]);
  if (pathname === '/blog' || pathname === '/blog/') pathname = '/';
  if (pathname.startsWith('/blog/')) pathname = pathname.slice('/blog'.length);
  pathname = pathname.replace(/^\/+/, '');
  if (!pathname || pathname.endsWith('/')) pathname += 'index.html';

  const filePath = path.resolve(root, pathname);
  return filePath.startsWith(root) ? filePath : null;
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
      await sendFile(res, path.join(root, '404.html'), 404);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local preview: http://127.0.0.1:${port}/blog/`);
});
