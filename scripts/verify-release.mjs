import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const excluded = new Set(['sw.js']);
async function files(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? files(file, root) : [relative(root, file)];
  }))).flat();
}

const releaseFiles = (await files(dist)).filter(file => !excluded.has(file)).sort();
const digest = createHash('sha256');
for (const file of releaseFiles) {
  digest.update(file);
  const content = await readFile(join(dist, file));
  // Build hashes generated metadata with placeholders, then stamps it after the digest is known.
  const normalized = file === 'manifest.webmanifest'
    ? content.toString().replace(/pwa-[a-f0-9]{16}/, 'pwa-__RELEASE_ID__')
    : file === '404.html'
      ? content.toString().replace(/Build v\d+\.\d+\.\d+/, 'Build __BUILD_ID__')
      : content;
  digest.update(normalized);
}
const release = digest.digest('hex').slice(0, 16);
const worker = await readFile(join(dist, 'sw.js'), 'utf8');
const index = await readFile(join(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(join(dist, 'manifest.webmanifest'), 'utf8'));
const config = JSON.parse(await readFile(join(dist, 'staticwebapp.config.json'), 'utf8'));

if (!worker.includes(`dose-witness-shell-${release}`)) throw new Error('Service-worker cache namespace does not match release content.');
for (const match of index.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) {
  if (!worker.includes(match[1])) throw new Error(`Service worker does not precache ${match[1]}.`);
}
if (!manifest.start_url.endsWith(`pwa-${release}`)) throw new Error('Manifest start URL does not match release content.');
if (!/Build v\d+\.\d+\.\d+/.test(await readFile(join(dist, '404.html'), 'utf8'))) throw new Error('Not-found page is missing its stamped build id.');
const assetRoute = config.routes.find(route => route.route === '/assets/*');
if (assetRoute?.headers?.['Cache-Control'] !== 'public, max-age=31536000, immutable') throw new Error('Hashed asset cache policy is missing.');
if (!config.globalHeaders?.['Content-Security-Policy'] || !config.globalHeaders?.['Permissions-Policy']) throw new Error('Browser hardening headers are missing.');
console.log(`Verified release ${release}: release-derived worker cache, immutable assets, CSP, and Permissions-Policy.`);
