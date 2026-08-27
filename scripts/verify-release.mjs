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
  // Build hashes the manifest with its placeholder, then stamps the derived ID.
  digest.update(file === 'manifest.webmanifest'
    ? content.toString().replace(/pwa-[a-f0-9]{16}/, 'pwa-__RELEASE_ID__')
    : content);
}
const release = digest.digest('hex').slice(0, 16);
const worker = await readFile(join(dist, 'sw.js'), 'utf8');
const manifest = JSON.parse(await readFile(join(dist, 'manifest.webmanifest'), 'utf8'));
const config = JSON.parse(await readFile(join(dist, 'staticwebapp.config.json'), 'utf8'));

if (!worker.includes(`dose-witness-shell-${release}`)) throw new Error('Service-worker cache namespace does not match release content.');
if (!manifest.start_url.endsWith(`pwa-${release}`)) throw new Error('Manifest start URL does not match release content.');
const assetRoute = config.routes.find(route => route.route === '/assets/*');
if (assetRoute?.headers?.['Cache-Control'] !== 'public, max-age=31536000, immutable') throw new Error('Hashed asset cache policy is missing.');
if (!config.globalHeaders?.['Content-Security-Policy'] || !config.globalHeaders?.['Permissions-Policy']) throw new Error('Browser hardening headers are missing.');
console.log(`Verified release ${release}: release-derived worker cache, immutable assets, CSP, and Permissions-Policy.`);
