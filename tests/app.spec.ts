import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('real board records a dose and persists it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Set up my board' }).click();
  await page.getByLabel('Medication name *').fill('Evening tablet');
  await page.getByLabel('Strength as written').fill('10 mg');
  await page.getByLabel('Existing instructions').fill('With food');
  await page.getByLabel('Time 1').fill('20:00');
  await page.getByRole('button', { name: 'Add to board' }).click();
  await page.getByRole('button', { name: /Record/ }).click();
  await page.locator('label[for="status-uncertain"]').click();
  await page.getByLabel('Caregiver initials *').fill('AK');
  await page.getByLabel('Handoff note').fill('Please confirm before the next scheduled dose.');
  await page.getByRole('dialog').getByRole('button', { name: 'Record dose', exact: true }).click();
  await page.reload();
  await expect(page.getByText(/Witnessed by AK/)).toBeVisible();
  await page.getByRole('link', { name: /handoff/i }).first().click();
  await expect(page).toHaveURL('/handoff');
  await expect(page.getByText(/Please confirm/)).toBeVisible();
});

test('dialogs close with Escape and restore focus', async ({ page }) => {
  await page.goto('/demo');
  const trigger = page.getByRole('button', { name: 'Change record' }).first();
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('legal pages have one main heading and no serious axe findings', async ({ page }) => {
  for (const path of ['/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  }
});

test('release worker cleans an older cache', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => caches.open('dose-witness-shell-prior-release'));
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => caches.keys())).not.toContain('dose-witness-shell-prior-release');
});

test('built deployment policy includes browser hardening', async () => {
  const config = JSON.parse(await readFile(resolve('dist/staticwebapp.config.json'), 'utf8'));
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(config.responseOverrides['404'].statusCode).toBe(404);
});

test('cold loads have no console errors or failed same-origin responses', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.url().startsWith('http://127.0.0.1:4173') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  for (const path of ['/', '/demo', '/medications', '/handoff', '/settings', '/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});
