// Cadrage de la carte d'Explorer : centrée sur la destination choisie, puis retour au cadrage de départ quand
// on l'efface ; « Recentrer » ramène sur la destination tant qu'elle est choisie. Échantillon, sans réseau.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const DATE = '2026-11-18';
// Beaune (EX000002) choisie dans la recherche, comme après un toucher dans la liste (D084).
const AVEC_BEAUNE = `/?date=${DATE}&recherche=Beaune&destination=EX000002`;

test.use({ geolocation: { latitude: 47.3233, longitude: 5.0272 }, permissions: ['geolocation'] });

test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

const gareDepart = (page: Page) => page.getByRole('img', { name: 'Gare de Dijon-Ville' });
const gareBeaune = (page: Page) =>
  page.getByRole('button', { name: /^Beaune.*en train direct(,|$)/ });

test('destination choisie : la carte est sur Beaune, Dijon hors de l’écran', async ({ page }) => {
  await page.goto(AVEC_BEAUNE);
  await expect(gareBeaune(page)).toBeInViewport();
  await expect(gareDepart(page)).not.toBeInViewport();
});

test('le ✕ de la recherche ramène la carte au cadrage de départ', async ({ page }) => {
  await page.goto(AVEC_BEAUNE);
  await expect(gareDepart(page)).not.toBeInViewport();
  await page.getByRole('button', { name: 'Effacer la recherche' }).click();
  await expect(page).not.toHaveURL(/destination=/);
  await expect(gareDepart(page)).toBeInViewport();
});

test('« Recentrer » ramène sur la destination tant qu’elle est choisie', async ({ page }) => {
  await page.goto(AVEC_BEAUNE);
  await expect(gareBeaune(page)).toBeInViewport();
  await page.getByRole('button', { name: 'Recentrer' }).click();
  await expect(gareBeaune(page)).toBeInViewport();
  await expect(gareDepart(page)).not.toBeInViewport();
});

// Le chemin de Hardy sur iPhone : Beaune choisie dans la page « Trajet », la feuille des résultats monte
// tout en haut, puis le ✕ de la barre.
test('téléphone : Beaune choisie dans « Trajet », puis ✕ : retour au cadrage de départ', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'La page « Trajet » n’existe que sur téléphone.');
  await page.goto(`/?date=${DATE}`);
  await expect(gareDepart(page)).toBeInViewport();
  await page
    .getByRole('group', { name: /^Trajet :/ })
    .getByRole('button', { name: /^Destination :/ })
    .click();
  const pageTrajet = page.getByRole('dialog', { name: 'Trajet' });
  await pageTrajet.getByRole('searchbox', { name: 'Destination' }).fill('Beaune');
  await pageTrajet
    .getByRole('button', { name: /^Beaune/ })
    .first()
    .click();
  await expect(page).toHaveURL(/destination=EX000002/);
  await expect(gareDepart(page)).not.toBeInViewport();

  await page.getByRole('button', { name: 'Effacer la recherche' }).click();
  await expect(page).not.toHaveURL(/destination=/);
  await expect(gareDepart(page)).toBeInViewport();
});
