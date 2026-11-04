// Parcours de l'écran Explorer, sur l'échantillon (données d'exemple, db/echantillon/).
// Sans réseau : fond de carte et recherche de ville simulés. Date fixe, présente dans l'échantillon.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const DIJON_VILLE = { latitude: 47.3233, longitude: 5.0272 };
const DATE = '2026-11-18';
const ECRAN = `/?date=${DATE}`;

const VILLE_TROUVEE = 'Dijon, Côte-d’Or';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
  await context.route('**/api/geocodage?*', (requete) =>
    requete.fulfill({
      json: {
        resultats: [
          {
            libelle: VILLE_TROUVEE,
            commune: 'Dijon',
            lat: DIJON_VILLE.latitude,
            lon: DIJON_VILLE.longitude,
            type: 'commune',
          },
        ],
        horsLigne: false,
      },
    }),
  );
});

const sorties = (page: Page) => page.getByRole('link', { name: 'Voir la sortie' });
const marqueurs = (page: Page) => page.getByRole('button', { name: /en train direct$/ });
const titreDestinations = (page: Page) =>
  page.getByRole('heading', { name: 'En train direct depuis Dijon-Ville' });

test.describe('position acceptée', () => {
  test.use({ geolocation: DIJON_VILLE, permissions: ['geolocation'] });

  // Une date d'hiver et une date d'été (08-conventions § 7).
  for (const date of [DATE, '2026-07-15']) {
    test(`les résultats arrivent sans action, puis une destination s’ouvre (${date})`, async ({
      page,
    }) => {
      await page.goto(`/?date=${date}`);
      await expect(titreDestinations(page)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Autour de Dijon' })).toBeVisible();
      await expect(sorties(page).first()).toBeVisible();

      await sorties(page).first().click();
      await expect(page).toHaveURL(
        new RegExp(`/destinations/[^/]+\\?depuis=EX000001&date=${date}$`),
      );
    });
  }

  test('aucune position dans l’adresse de la page', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(titreDestinations(page)).toBeVisible();
    expect(page.url()).not.toMatch(/lat|lon|47\.3|5\.02/);
    expect(new URL(page.url()).searchParams.has('gare')).toBe(false);
  });

  test('une catégorie met à jour la liste et la carte, « Tout » les rétablit', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    await expect(marqueurs(page).first()).toBeAttached();
    const nombreInitial = await sorties(page).count();
    await expect(marqueurs(page)).toHaveCount(nombreInitial);

    const categories = page.getByRole('group', { name: 'Catégories' });
    await categories.getByRole('button', { name: 'Enfants' }).click();
    await expect.poll(() => sorties(page).count()).toBeLessThan(nombreInitial);
    await expect(sorties(page).first()).toBeVisible();
    await expect(marqueurs(page)).toHaveCount(await sorties(page).count());

    await categories.getByRole('button', { name: 'Tout' }).click();
    await expect(sorties(page)).toHaveCount(nombreInitial);
    await expect(marqueurs(page)).toHaveCount(nombreInitial);
  });

  test('une épingle de destination ouvre sa mini-fiche, recentrer la referme', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();

    const pleinEcran = page.getByRole('button', { name: 'Carte plein écran' });
    if (await pleinEcran.isVisible()) await pleinEcran.click();

    const epingle = marqueurs(page).filter({ visible: true }).first();
    await epingle.click();
    const choisie = marqueurs(page).and(page.locator('[aria-pressed="true"]'));
    await expect(choisie).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Fermer' })).toBeVisible();

    await page.getByRole('button', { name: 'Recentrer' }).click();
    await expect(choisie).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Fermer' })).toHaveCount(0);
  });

  test('une date hors des horaires propose de revenir à aujourd’hui', async ({ page }) => {
    await page.goto('/?date=2020-01-01');
    await expect(page.getByRole('button', { name: /aujourd/i }).last()).toBeVisible();
    await expect(sorties(page)).toHaveCount(0);
  });
});

test.describe('position refusée', () => {
  test.use({ permissions: [] });

  test('la recherche de ville mène aux mêmes résultats', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_succes, echec) =>
        echec?.({
          code: 1,
          message: 'refusée',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
    });
    await page.goto(ECRAN);
    await expect(
      page.getByRole('heading', { name: 'Dans quelle ville êtes-vous ?' }),
    ).toBeVisible();
    await expect(sorties(page)).toHaveCount(0);

    await page.getByPlaceholder('Nom de ville ou de gare').fill('Dijon');
    await page.getByRole('button', { name: VILLE_TROUVEE }).click();

    await expect(titreDestinations(page)).toBeVisible();
    await expect(page).toHaveURL(/gare=EX000001/);
    await expect(sorties(page).first()).toBeVisible();
  });
});
