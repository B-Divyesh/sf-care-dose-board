import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('skip link transfers keyboard focus to the dose board', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to dose board' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page).toHaveURL(/#main-content$/);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /add medication/i }).first()).toBeFocused();
});

test('release worker derives a new cache namespace and removes an older release cache', async ({ page }) => {
  await page.goto('/offline.html');
  await page.evaluate(() => caches.open('dose-witness-shell-prior-release'));
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const worker = await (await page.request.get('/sw.js')).text();
  const cacheName = worker.match(/const CACHE = '([^']+)'/)?.[1];
  expect(cacheName).toMatch(/^dose-witness-shell-[a-f0-9]{16}$/);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json() as { start_url: string };
  expect(manifest.start_url).toBe(`/?source=pwa-${cacheName?.replace('dose-witness-shell-', '')}`);

  const cachesAfterActivation = await page.evaluate(async () => caches.keys());
  expect(cachesAfterActivation).toContain(cacheName);
  expect(cachesAfterActivation).not.toContain('dose-witness-shell-prior-release');
  const cachedShell = await page.evaluate(async activeCache => Boolean(await (await caches.open(activeCache)).match('/index.html')), cacheName!);
  expect(cachedShell).toBe(true);

});

test('static deployment policy ships immutable hashed assets and browser hardening', async () => {
  const config = JSON.parse(await readFile(resolve(process.cwd(), 'dist/staticwebapp.config.json'), 'utf8')) as {
    globalHeaders: Record<string, string>;
    mimeTypes: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(config.globalHeaders['Content-Security-Policy']).toContain("script-src 'self'");
  expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  expect(config.routes.find(route => route.route === '/assets/*')?.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
  expect(config.routes.find(route => route.route === '/sw.js')?.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
});

test('keyboard skip link moves focus into the dose board', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to dose board' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page).toHaveURL(/#main-content$/);
});

test('records a witnessed dose, persists it, and stays available offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /today’s dose board/i })).toBeVisible();
  let accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);

  await page.getByRole('button', { name: 'Add the first medication' }).click();
  await page.getByLabel('Medication name *').fill('Evening tablet');
  await page.getByLabel('Strength as written').fill('10 mg');
  await page.getByLabel('Existing instructions').fill('With food');
  await page.getByLabel('Time 1').fill('08:00');
  await page.getByRole('button', { name: 'Add to board' }).click();

  await expect(page.getByRole('heading', { name: 'Evening tablet' })).toBeVisible();
  await page.getByRole('button', { name: /Record/ }).click();
  await page.locator('label[for="status-uncertain"]').click();
  await page.getByLabel('Caregiver initials *').fill('AK');
  await page.getByLabel('Handoff note').fill('Packet was open; please confirm before the next scheduled dose.');
  await page.getByRole('button', { name: 'Record dose', exact: true }).click();
  await expect(page.getByText(/Uncertain/).first()).toBeVisible();
  await expect(page.getByText(/Witnessed by AK/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/Witnessed by AK/)).toBeVisible();
  await page.getByRole('link', { name: /handoff/i }).first().click();
  await expect(page.getByText(/Packet was open/)).toBeVisible();

  accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);

  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.evaluate(() => dispatchEvent(new Event('offline')));
  await expect(page.getByText(/Offline — this board still saves/)).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Handoff' })).toBeVisible();
  await expect(page.getByText(/Packet was open/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('replaces a previous worker cache when a release update is found', async ({ page, context }) => {
  const oldWorker = `const CACHE = 'dose-witness-shell-regression-old';
    self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.put('/old', new Response('old')))));
    self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
    self.addEventListener('fetch', () => {});
    self.skipWaiting();`;
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.route('**/old-sw.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: oldWorker,
  }));
  await page.evaluate(() => navigator.serviceWorker.register('/old-sw.js', { scope: '/' }));
  await expect.poll(() => page.evaluate(() => caches.keys())).toContain('dose-witness-shell-regression-old');

  await context.unroute('**/old-sw.js');
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js', { scope: '/' }));
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    return !keys.includes('dose-witness-shell-regression-old') && keys.some(key => /^dose-witness-shell-[a-f0-9]{16}$/.test(key));
  });
  await expect(page.locator('.toast').first()).toContainText('A refreshed Dose Witness is ready.');
});

test('legal pages have landmarks and a single page heading', async ({ page }) => {
  for (const path of ['/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  }
});
