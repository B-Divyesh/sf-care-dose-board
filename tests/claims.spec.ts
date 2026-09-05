import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('@claim:status-recording records every status, initials, and notes', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText(/Witnessed by AK/)).toBeVisible();
  await expect(page.getByText(/Uncertain/).first()).toBeVisible();
  await page.getByRole('button', { name: /Record/ }).last().click();
  await page.locator('label[for="status-skipped"]').click();
  await page.getByLabel('Caregiver initials *').fill('LM');
  await page.getByLabel('Handoff note').fill('Away during the scheduled time.');
  await page.getByRole('dialog').getByRole('button', { name: 'Record dose', exact: true }).click();
  await expect(page.getByText(/Witnessed by LM/)).toBeVisible();
  await page.getByRole('link', { name: /handoff/i }).first().click();
  await expect(page.getByText('Away during the scheduled time.')).toBeVisible();
  await expect(page.locator('.activity-status.given')).toHaveCount(1);
  await expect(page.locator('.activity-status.uncertain')).toHaveCount(1);
  await expect(page.locator('.activity-status.skipped')).toHaveCount(1);
});

test('@claim:single-visible-record keeps one current dose card and visible correction history', async ({ page }) => {
  await page.goto('/demo');
  const dose = page.locator('.dose-card').filter({ hasText: 'Blood pressure tablet' });
  await expect(dose).toHaveCount(1);
  await dose.getByRole('button', { name: 'Change record' }).click();
  await page.locator('label[for="status-skipped"]').click();
  await page.getByRole('button', { name: 'Update record' }).click();
  await expect(page.locator('.dose-card').filter({ hasText: 'Blood pressure tablet' })).toHaveCount(1);
  await page.getByRole('link', { name: /handoff/i }).first().click();
  await expect(page.locator('.activity-item').filter({ hasText: 'Blood pressure tablet' })).toHaveCount(2);
});

test('@claim:demo-isolation resets, exits, and never changes the real board', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL('/demo');
  await page.locator('.dose-card').last().scrollIntoViewIfNeeded();
  for (const control of [
    page.getByText('Demo — sample data, nothing is saved'),
    page.getByRole('button', { name: 'Reset demo' }),
    page.getByRole('button', { name: 'Start for real' }),
  ]) await expect(control).toBeInViewport();
  await expect.poll(async () => {
    const [banner, header] = await Promise.all([page.locator('.demo-banner').boundingBox(), page.getByRole('banner').boundingBox()]);
    return (banner?.y ?? -Infinity) >= (header?.y ?? 0) + (header?.height ?? 0);
  }).toBe(true);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.dose-card').filter({ hasText: 'Blood pressure tablet' })).toContainText('Given');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/');
  await page.getByRole('button', { name: 'Set up my board' }).click();
  await page.getByLabel('Medication name *').fill('Real household tablet');
  await page.getByLabel('Time 1').fill('09:00');
  await page.getByRole('button', { name: 'Add to board' }).click();
  await expect(page.getByRole('heading', { name: 'Real household tablet' })).toBeVisible();
  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('Blood pressure tablet')).toBeVisible();
  await page.getByRole('button', { name: 'Change record' }).first().click();
  await page.locator('label[for="status-skipped"]').click();
  await page.getByRole('button', { name: 'Update record' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.dose-card').filter({ hasText: 'Blood pressure tablet' })).toContainText('Given');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Real household tablet')).toBeVisible();
  await expect(page.getByText('Blood pressure tablet')).toHaveCount(0);
});

test('@claim:device-only keeps demo care data in same-origin session storage', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Change record' }).first().click();
  await page.getByLabel('Handoff note').fill('Changed only inside the demo tab.');
  await page.getByRole('button', { name: 'Update record' }).click();
  await page.getByRole('link', { name: /handoff/i }).first().click();
  await expect(page.getByText('Changed only inside the demo tab.')).toBeVisible();
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
  expect(await page.evaluate(() => sessionStorage.getItem('demo:dose-witness'))).toContain('Changed only inside the demo tab.');
  expect(await page.evaluate(async () => (await indexedDB.databases()).map(item => item.name))).toEqual([]);
});

test('@claim:offline-reload reloads and records in the demo without a connection', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const cachedUrls = await page.evaluate(async () => {
    const keys = await caches.keys();
    return (await Promise.all(keys.map(async key => (await (await caches.open(key)).keys()).map(request => new URL(request.url).pathname)))).flat();
  });
  expect(cachedUrls.some(url => url.startsWith('/assets/') && url.endsWith('.js'))).toBe(true);
  expect(cachedUrls).toContain('/index.html');
  await page.reload();
  await expect(page.getByText('Blood pressure tablet')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Blood pressure tablet')).toBeVisible();
  await page.getByRole('button', { name: /Record/ }).last().click();
  await page.getByLabel('Caregiver initials *').fill('AK');
  await page.getByRole('dialog').getByRole('button', { name: 'Record dose', exact: true }).click();
  await expect(page.getByText(/Witnessed by AK/).last()).toBeVisible();
});

test('@claim:encrypted-handoff exports ciphertext and imports it with the passphrase', async ({ page }) => {
  await page.goto('/handoff?demo=1');
  await page.getByLabel('Handoff passphrase').fill('sample passphrase');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download encrypted copy' }).click();
  const path = await (await downloadPromise).path();
  if (!path) throw new Error('Encrypted handoff did not download.');
  const payload = await readFile(path, 'utf8');
  expect(payload).toContain('dose-witness-encrypted');
  expect(payload).not.toContain('Meera');
  await page.evaluate(() => sessionStorage.setItem('demo:dose-witness', JSON.stringify({ version: 1, householdName: 'Empty demo', patientName: '', caregiverInitials: '', medications: [], logs: [], audit: [], updatedAt: new Date(0).toISOString() })));
  await page.reload();
  await page.getByLabel('Encrypted handoff file').setInputFiles(path);
  await page.getByLabel('Passphrase', { exact: true }).fill('sample passphrase');
  await page.getByRole('button', { name: 'Open and merge' }).click();
  await expect(page.getByText('Encrypted handoff merged into this board.')).toBeVisible();
  await page.getByRole('link', { name: /medications/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Blood pressure tablet' })).toBeVisible();
});

test('@claim:merge-resolution retains unique records and the newest conflicting edit', async ({ page }) => {
  await page.goto('/medications?demo=1');
  await page.locator('.med-card').filter({ hasText: 'Evening tablet' }).getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Active on today’s board').uncheck();
  await page.getByRole('button', { name: 'Save medication' }).click();
  await page.getByRole('button', { name: 'Add medication' }).click();
  await page.getByLabel('Medication name *').fill('Imported-only tablet');
  await page.getByLabel('Time 1').fill('16:00');
  await page.getByRole('button', { name: 'Add to board' }).click();
  await page.getByRole('link', { name: /handoff/i }).first().click();
  await page.getByLabel('Handoff passphrase').fill('merge passphrase');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download encrypted copy' }).click();
  const path = await (await downloadPromise).path();
  if (!path) throw new Error('Merge fixture did not download.');
  await page.getByRole('link', { name: /medications/i }).first().click();
  await page.locator('.med-card').filter({ hasText: 'Blood pressure tablet' }).getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Medication name *').fill('Updated blood pressure tablet');
  await page.getByRole('button', { name: 'Save medication' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('.med-card').filter({ hasText: 'Imported-only tablet' }).getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('link', { name: /handoff/i }).first().click();
  await page.getByLabel('Encrypted handoff file').setInputFiles(path);
  await page.getByLabel('Passphrase', { exact: true }).fill('merge passphrase');
  await page.getByRole('button', { name: 'Open and merge' }).click();
  await page.getByRole('link', { name: /medications/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Updated blood pressure tablet' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Imported-only tablet' })).toBeVisible();
});

test('@claim:no-paid-checkout adds a fourth medication without a purchase path', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/medications?demo=1');
  await page.getByRole('button', { name: 'Add medication' }).click();
  await page.getByLabel('Medication name *').fill('Fourth sample tablet');
  await page.getByLabel('Time 1').fill('16:30');
  await page.getByRole('button', { name: 'Add to board' }).click();
  await expect(page.getByRole('heading', { name: 'Fourth sample tablet' })).toBeVisible();
  expect(await page.locator('a[href*="checkout"], a[href*="api.sociobot.in"]').count()).toBe(0);
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('@claim:print-handoff opens printing with the complete caregiver summary', async ({ page }) => {
  await page.addInitScript(() => { window.print = () => sessionStorage.setItem('print-called', 'yes'); });
  await page.goto('/handoff?demo=1');
  await expect(page.getByText('Recent witnessed activity')).toBeVisible();
  await expect(page.getByText(/Packet was open/)).toBeVisible();
  await page.getByRole('button', { name: 'Print handoff' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('print-called'))).toBe('yes');
});

test('@claim:route-metadata gives every route a title, canonical, focus, and a complete HTTP not-found page', async ({ page }) => {
  const routes = [['/', 'Dose Witness — record household medication doses'], ['/demo', 'Demo — Dose Witness'], ['/privacy', 'Privacy — Dose Witness'], ['/terms', 'Terms — Dose Witness']];
  for (const [path, title] of routes) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/care-dose-board\.sociobot\.in\//);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  }
  const notFound = await page.goto('/not-a-real-route-review');
  expect(notFound?.status()).toBe(404);
  await expect(page).toHaveTitle('Not found — Dose Witness');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /does not exist/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://care-dose-board.sociobot.in/404');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-dose-watch\.jpg$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/icons/icon.svg');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icons/apple-touch-icon.png');
  await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('Dose Witness');
  await expect(page.getByRole('contentinfo')).toContainText('Built by Param Factory');
  await expect(page.getByRole('contentinfo')).toContainText(/Build v\d+\.\d+\.\d+/);
  await page.goto('/');
  await page.getByRole('link', { name: /medications/i }).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('link', { name: 'Read artwork details' }).click();
  await expect(page).toHaveURL('/settings#about-art');
  const about = page.getByRole('heading', { name: 'Privacy and purpose' });
  await expect(about).toBeFocused();
  await expect.poll(async () => {
    const [targetBox, headerBox] = await Promise.all([about.boundingBox(), page.getByRole('banner').boundingBox()]);
    return (targetBox?.y ?? -Infinity) >= (headerBox?.y ?? 0) + (headerBox?.height ?? 0);
  }).toBe(true);
});

test('@claim:accessible-use supports keyboard, reduced motion, mobile zoom, and serious axe checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = '32px'; }));
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to dose board' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  const duration = await page.getByRole('button', { name: 'Set up my board' }).evaluate(element => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const actions = page.locator('main a[href], main button');
  for (let index = 0; index < await actions.count(); index += 1) {
    const action = actions.nth(index);
    if (!await action.isVisible()) continue;
    await action.evaluate(element => element.scrollIntoView({ block: 'center' }));
    const clearOfDock = await action.evaluate(element => {
      const box = element.getBoundingClientRect();
      const dock = document.querySelector('.mobile-nav')?.getBoundingClientRect();
      return !dock || box.bottom <= dock.top;
    });
    expect(clearOfDock).toBe(true);
  }
  for (const path of ['/', '/demo', '/medications?demo=1', '/handoff?demo=1', '/settings?demo=1', '/privacy', '/terms', '/not-a-real-route-review']) {
    await page.goto(path);
    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  }
});

test('@claim:installable-pwa ships an install manifest and a release-stamped offline shell', async ({ page }) => {
  await page.goto('/demo');
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toMatch(/^\/\?source=pwa-[a-f0-9]{16}$/);
  expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ sizes: '192x192' }), expect.objectContaining({ sizes: '512x512', purpose: 'maskable' })]));
  const worker = await (await page.request.get('/sw.js')).text();
  expect(worker).toMatch(/dose-witness-shell-[a-f0-9]{16}/);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
});

test('@claim:product-boundaries states and keeps the product out of medical decisions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Records care. Never gives medical advice.')).toBeVisible();
  await expect(page.getByText(/does not check interactions, change prescriptions, recommend dosages, or contact a pharmacy/)).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByText(/does not verify prescriptions, identify interactions, recommend dosages/)).toBeVisible();
  expect(await page.locator('body').getByRole('button', { name: /recommend|prescribe|order medication/i }).count()).toBe(0);
});

test('@claim:release-package verifies the documented static, private, original, MIT release', async ({ page }) => {
  await page.goto('/demo');
  const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
  const config = JSON.parse(await readFile(resolve('dist/staticwebapp.config.json'), 'utf8'));
  expect(packageJson.scripts.build).toBe('tsc --noEmit && vite build');
  await access(resolve('dist/index.html'));
  await access(resolve('LICENSE'));
  await access(resolve('assets/src/dose-watch.png'));
  await access(resolve('assets/src/dose-watch.json'));
  expect(await readFile(resolve('LICENSE'), 'utf8')).toContain('Permission is hereby granted, free of charge');
  expect(config.globalHeaders['Content-Security-Policy']).toContain("script-src 'self'");
  expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable');
  const artwork = await page.request.get('/art/dose-watch.avif');
  expect(artwork.status()).toBe(200);
  expect(artwork.headers()['content-type']).toContain('image/avif');
  const response = await page.request.get('/');
  expect(response.headers()['content-security-policy']).toContain("default-src 'self'");
});
