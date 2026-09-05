import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const dist = join(process.cwd(), 'dist');
const config = JSON.parse(await readFile(join(dist, 'staticwebapp.config.json'), 'utf8'));
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT ?? 4173);
const types = {
  '.avif': 'image/avif', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8',
};

function routeFor(pathname) {
  return config.routes?.find(route => route.route === pathname)
    ?? config.routes?.find(route => route.route.endsWith('/*') && pathname.startsWith(route.route.slice(0, -1)));
}

async function existingFile(pathname) {
  if (pathname.includes('..')) return null;
  const relative = normalize(pathname).replace(/^[/\\]+/, '');
  const file = join(dist, relative || 'index.html');
  if (!file.startsWith(dist)) return null;
  try { return (await stat(file)).isFile() ? file : null; }
  catch { return null; }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);
  const route = routeFor(pathname);
  let file = await existingFile(pathname);
  let status = 200;
  if (!file && route?.rewrite) file = await existingFile(route.rewrite);
  if (!file) {
    const override = config.responseOverrides?.['404'];
    file = await existingFile(override?.rewrite ?? '/404.html');
    status = override?.statusCode ?? 404;
  }
  if (!file) { response.writeHead(500).end('Static preview could not find its fallback page.'); return; }
  response.writeHead(status, {
    ...config.globalHeaders,
    ...(route?.headers ?? {}),
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => console.log(`Serving ${dist} at http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
