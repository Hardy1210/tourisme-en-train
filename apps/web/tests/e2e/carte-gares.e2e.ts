// Gares sur la carte (D118, remarque ⑥ du professeur) : de loin, des points colorés par le temps de train ;
// de près, des icônes de train ; la destination du trajet a un bord jaune. Rien ne change dans le
// fonctionnement : mêmes boutons, mêmes noms. Échantillon (données d'exemple, db/echantillon/), réseau coupé.
import { expect, test, type Page } from './test';
import { couperLeReseau } from './outils';

test.use({ geolocation: { latitude: 47.3233, longitude: 5.0272 }, permissions: ['geolocation'] });

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

const gares = (page: Page) => page.getByRole('button', { name: /en train direct/ });

test('de loin (toute la région) : des points, sans icône de train', async ({ page }) => {
  // L'échantillon va jusqu'à Paris et Lyon : le premier cadrage est large, sous le seuil.
  await page.goto('/?date=2026-11-18');
  await expect(gares(page).first()).toBeVisible();
  await expect(gares(page).locator('svg')).toHaveCount(0);
});

test('de près : la destination du trajet en icône de train, avec le bord jaune', async ({
  page,
}) => {
  // Destination cherchée : la carte se cadre sur Beaune, au-dessus du seuil.
  await page.goto('/?date=2026-11-18&recherche=Beaune&destination=EX000002');
  const beaune = page.getByRole('button', { name: /^Beaune, / });
  await expect(beaune.locator('svg')).toHaveCount(1);
  await expect(beaune.locator('span').first()).toHaveClass(/ring-map-gare-choisie/);
});
