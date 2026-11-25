// Épingles des lieux (D119, maquette « Explorer ») : une goutte lilas au contour violet ; le lieu touché,
// plus grand et plein, sans anneau. Carte d'une destination (épingles en boutons). Échantillon, réseau coupé.
import { expect, test } from './test';
import { couperLeReseau } from './outils';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

test('carte d’une destination : le lieu touché prend la grande épingle pleine, pas les autres', async ({
  page,
}) => {
  await page.goto('/destinations/EX000002?depuis=EX000001&date=2026-11-18');
  const epingles = page.locator('.maplibregl-marker button[aria-pressed]');
  await expect(epingles.first()).toBeVisible({ timeout: 15_000 });
  await expect(epingles.locator('svg.fill-epingle-touchee-bg')).toHaveCount(0);

  await epingles.first().click();
  await expect(epingles.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(epingles.first().locator('svg').first()).toHaveClass(/fill-epingle-touchee-bg/);
  await expect(epingles.locator('svg.fill-epingle-touchee-bg')).toHaveCount(1);
});
