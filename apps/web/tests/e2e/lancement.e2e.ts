// Écran de lancement (D112) : à l'ouverture seulement, il s'efface seul, sans gêner la suite.
// Échantillon (données d'exemple, db/echantillon/), réseau extérieur coupé.
import { marque } from '../../src/config/marque';
import { expect, test, type Page } from './test';
import { couperLeReseau } from './outils';

test.use({ ecranLancement: true });

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

const ecran = (page: Page) => page.locator('[data-ecran-lancement]');
const onglet = (page: Page, nom: string) =>
  page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: nom });

test("couvre la page à l'ouverture, puis s'efface seul", async ({ page }) => {
  await page.goto('/sources');
  await expect(ecran(page)).toBeVisible();
  await expect(ecran(page)).toContainText(marque.accroche);
  await expect(ecran(page)).toBeHidden({ timeout: 5_000 });
  // Effacé, il laisse passer les touchers.
  await onglet(page, 'Lieux').click();
  await expect(page).toHaveURL(/\/lieux$/);
});

test("ne se rejoue pas en changeant d'écran", async ({ page }) => {
  await page.goto('/sources');
  await expect(ecran(page)).toBeHidden({ timeout: 5_000 });
  await onglet(page, 'Lieux').click();
  await expect(page).toHaveURL(/\/lieux$/);
  await expect(ecran(page)).toBeHidden();
});

test('est caché aux lecteurs d’écran', async ({ page }) => {
  await page.goto('/sources');
  await expect(ecran(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByRole('img', { name: marque.nom })).toHaveCount(0);
});

test.describe('« Réduire les animations »', () => {
  test.use({ reducedMotion: 'reduce' });

  test("s'efface aussi, sans fondu", async ({ page }) => {
    await page.goto('/sources');
    await expect(ecran(page)).toBeHidden({ timeout: 5_000 });
  });
});
