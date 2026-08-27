import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('records a witnessed dose, persists it, and stays available offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /today’s dose board/i })).toBeVisible();

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

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);

  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Handoff' })).toBeVisible();
  await expect(page.getByText(/Packet was open/)).toBeVisible();
  expect(errors).toEqual([]);
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
