// Écran de lancement (D112) : dans le HTML de départ, il s'efface seul, sans gêner la suite.
// « Visible à l'ouverture » n'est pas vérifié dans le navigateur : la page peut finir de charger après
// les 2 s de l'écran, et le parcours deviendrait instable. On vérifie le HTML que reçoit le téléphone.
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

test('est dans le HTML de départ, avant tout JavaScript', async ({ request }) => {
  const html = await (await request.get('/mon-espace')).text();
  expect(html).toContain('data-ecran-lancement');
  expect(html).toContain(marque.accroche);
});

test("s'efface seul, puis laisse passer les touchers", async ({ page }) => {
  await page.goto('/mon-espace');
  await expect(ecran(page)).toBeHidden({ timeout: 5_000 });
  await onglet(page, 'Lieux').click();
  await expect(page).toHaveURL(/\/lieux$/);
});

test("ne se rejoue pas en changeant d'écran", async ({ page }) => {
  await page.goto('/mon-espace');
  await expect(ecran(page)).toBeHidden({ timeout: 5_000 });
  await onglet(page, 'Lieux').click();
  await expect(page).toHaveURL(/\/lieux$/);
  await onglet(page, 'Mon espace').click();
  await expect(page).toHaveURL(/\/mon-espace$/);
  await expect(ecran(page)).toBeHidden({ timeout: 0 });
});

test('est caché aux lecteurs d’écran', async ({ page }) => {
  await page.goto('/mon-espace');
  await expect(ecran(page)).toHaveAttribute('aria-hidden', 'true');
});

test.describe('« Réduire les animations »', () => {
  test.use({ reducedMotion: 'reduce' });

  test("s'efface aussi, sans fondu", async ({ page }) => {
    await page.goto('/mon-espace');
    await expect(ecran(page)).toBeHidden({ timeout: 5_000 });
  });
});
