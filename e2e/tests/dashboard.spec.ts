import { expect, test } from '@playwright/test';

test.describe('dashboard smoke (Fase 5/7)', () => {
  test('overview shows graph stats and recent flows from the API', async ({ page }) => {
    await page.goto('/');

    // Overview renders the CFG stats served by the API via the Vite proxy.
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.getByText('Live Capital Flow Graph across chains, protocols, pools and wallets.')).toBeVisible();

    // The flows table renders a seeded flow (any flow type label).
    await expect(page.getByRole('table')).toBeVisible();
    await expect(
      page.getByRole('table').getByText(/Deposit|Borrow|Withdraw|Transfer|Swap/),
    ).toBeVisible();
  });

  test('graph explorer renders the flow canvas', async ({ page }) => {
    await page.goto('/graph');
    await expect(page.getByRole('heading', { name: 'Capital Flow Graph' })).toBeVisible();
    // React Flow canvas paints (nodes render as part of it).
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 15_000 });
  });

  test('lenses page lists seeded lenses', async ({ page }) => {
    await page.goto('/lenses');
    await expect(page.getByRole('heading', { name: 'Lens marketplace' })).toBeVisible();
  });
});
