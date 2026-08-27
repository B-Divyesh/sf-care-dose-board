import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readPublic = (file: string) => readFile(resolve(process.cwd(), 'public', file), 'utf8');

describe('static release policy', () => {
  it('declares immutable caching only for content-hashed assets', async () => {
    const config = JSON.parse(await readPublic('staticwebapp.config.json'));
    const immutable = config.routes.find((route: { route: string }) => route.route === '/assets/*');
    expect(immutable.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(config.routes.find((route: { route: string }) => route.route === '/sw.js').headers['Cache-Control']).toContain('no-cache');
  });

  it('locks down browser capabilities while allowing the optional license verification', async () => {
    const config = JSON.parse(await readPublic('staticwebapp.config.json'));
    const headers = config.globalHeaders;
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['Content-Security-Policy']).toContain('connect-src \'self\' https://api.sociobot.in');
    expect(headers['Content-Security-Policy']).toContain("script-src 'self'");
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Permissions-Policy']).toContain('geolocation=()');
  });

  it('keeps the service worker release placeholder build-owned', async () => {
    const worker = await readPublic('sw.js');
    const manifest = await readPublic('manifest.webmanifest');
    expect(worker).toContain('dose-witness-shell-__RELEASE_ID__');
    expect(manifest).toContain('pwa-__RELEASE_ID__');
  });
});
