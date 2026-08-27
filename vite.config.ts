import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { releaseRevision } from './scripts/release-content.mjs';

async function releaseEntries(directory: string, prefix = ''): Promise<Array<[string, Buffer]>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const output: Array<[string, Buffer]> = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (relative === 'sw.js' || relative === 'manifest.webmanifest') continue;
    if (entry.isDirectory()) output.push(...await releaseEntries(resolve(directory, entry.name), relative));
    else output.push([relative, await readFile(resolve(directory, entry.name))]);
  }
  return output;
}

function releasePwa(): Plugin {
  return {
    name: 'release-derived-pwa',
    apply: 'build',
    async writeBundle(options) {
      // This hook runs after Vite has copied the public directory and written
      // every hashed chunk. The namespace therefore fingerprints the exact
      // release payload, not a source-tree approximation.
      const outputDirectory = options.dir ?? resolve(import.meta.dirname, 'dist');
      const files = await releaseEntries(outputDirectory);
      const revision = releaseRevision(files);
      const shell = ['/', '/index.html', '/offline.html', '/manifest.webmanifest', ...files.map(([name]) => `/${name}`)]
        .filter(url => !url.endsWith('/staticwebapp.config.json'));
      const worker = `const CACHE = 'dose-witness-shell-${revision}';
const PRECACHE = ${JSON.stringify([...new Set(shell)].sort())};

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('dose-witness-shell-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      caches.open(CACHE).then(cache => cache.put('/index.html', response.clone()));
      return response;
    }).catch(async () => (await caches.match('/index.html', { ignoreVary: true })) || caches.match('/offline.html', { ignoreVary: true })));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request, { ignoreVary: true })));
    return;
  }

  event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
`;
      const manifest = JSON.stringify({
        name: 'Dose Witness', short_name: 'Dose Witness', description: 'A private household board for witnessing scheduled medication doses.',
        id: '/', start_url: `/?source=pwa-${revision}`, scope: '/', display: 'standalone', orientation: 'any', background_color: '#071319', theme_color: '#071319',
        categories: ['medical', 'utilities', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      }, null, 2);
      await Promise.all([
        writeFile(resolve(outputDirectory, 'sw.js'), worker),
        writeFile(resolve(outputDirectory, 'manifest.webmanifest'), `${manifest}\n`),
      ]);
    },
  };
}

export default defineConfig({
  plugins: [releasePwa()],
  test: {
    include: ['src/**/*.test.ts'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 2048,
  },
});
