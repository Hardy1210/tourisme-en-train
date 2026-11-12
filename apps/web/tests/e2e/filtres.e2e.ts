// Filtres d'Explorer et de Lieux (F05) : chaque filtre change la liste (et la carte pour les destinations),
// reste dans l'adresse de la page et tient après un rechargement. Catégories et date : explorer.e2e.ts et
// date-filtres.e2e.ts. Échantillon (db/echantillon/), sans réseau, position simulée au centre de Dijon.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const DIJON = { latitude: 47.3233, longitude: 5.0272 };
const BEAUNE = { lat: 47.0237, lon: 4.8436 };
const DATE = '2026-11-18';

test.use({ geolocation: DIJON, permissions: ['geolocation'] });

test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
  await context.route('**/api/geocodage?*', (requete) =>
    requete.fulfill({
      json: {
        resultats: [
          { libelle: 'Beaune, Côte-d’Or', commune: 'Beaune', ...BEAUNE, type: 'commune' },
        ],
        horsLigne: false,
      },
    }),
  );
});

const sorties = (page: Page) => page.getByRole('link', { name: 'Voir la sortie' });
const marqueurs = (page: Page) => page.getByRole('button', { name: /en train direct$/ });
const boutonFiltres = (page: Page) => page.getByRole('button', { name: /^Filtres/ });
const feuilleFiltres = (page: Page) => page.getByRole('dialog', { name: 'Filtres' });

/** Ouvre « Filtres », fait `choix`, puis referme par le bouton du bas. */
async function dansFiltres(
  page: Page,
  choix: (feuille: ReturnType<typeof feuilleFiltres>) => Promise<void>,
) {
  await boutonFiltres(page).click();
  await choix(feuilleFiltres(page));
  await feuilleFiltres(page)
    .getByRole('button', { name: /^Voir les (sorties|lieux)$/ })
    .click();
  await expect(feuilleFiltres(page)).toHaveCount(0);
}

const option = (feuille: ReturnType<typeof feuilleFiltres>, groupe: string, libelle: string) =>
  feuille.getByRole('group', { name: groupe }).getByRole('radio', { name: libelle });

test.describe('Explorer', () => {
  const ECRAN = `/?date=${DATE}`;

  test('temps de train : 30 min réduit la liste et la carte, reste après un rechargement', async ({
    page,
  }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    const toutes = await sorties(page).count();

    await dansFiltres(page, (feuille) =>
      option(feuille, 'Temps de train maximum', '30 min').click(),
    );
    await expect(page).toHaveURL(/dureeMax=30/);
    await expect.poll(() => sorties(page).count()).toBeLessThan(toutes);
    const reduites = await sorties(page).count();
    await expect(marqueurs(page)).toHaveCount(reduites);

    await page.reload();
    await expect(sorties(page).first()).toBeVisible();
    await expect(sorties(page)).toHaveCount(reduites);

    await boutonFiltres(page).click();
    await feuilleFiltres(page).getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(page).not.toHaveURL(/dureeMax=/);
    await expect(sorties(page)).toHaveCount(toutes);
  });

  test('« Faisable dans la journée » réduit la liste et la carte, reste après un rechargement', async ({
    page,
  }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    const toutes = await sorties(page).count();

    await dansFiltres(page, (feuille) =>
      feuille.getByRole('switch', { name: /Faisable dans la journée/ }).click(),
    );
    await expect(page).toHaveURL(/faisable=1/);
    await expect.poll(() => sorties(page).count()).toBeLessThan(toutes);
    const faisables = await sorties(page).count();
    await expect(marqueurs(page)).toHaveCount(faisables);

    await page.reload();
    await expect(sorties(page).first()).toBeVisible();
    await expect(sorties(page)).toHaveCount(faisables);
  });

  // Test léger (A-FAIRE : la section « À deux pas » va évoluer) : le nombre de lieux et l'adresse.
  test('rayon : 1 km montre moins de lieux à deux pas, reste après un rechargement', async ({
    page,
  }) => {
    const section = page.getByRole('region', { name: 'À deux pas de vous' });
    const lieux = section.getByRole('listitem');
    await page.goto(ECRAN);
    await expect(lieux.first()).toBeVisible();
    const autour = await lieux.count();

    const demande = page.waitForRequest(
      (r) => r.url().includes('/api/lieux') && r.url().includes('rayon=1000'),
    );
    await dansFiltres(page, (feuille) => option(feuille, 'Rayon autour de moi', '1 km').click());
    await demande;
    await expect(page).toHaveURL(/rayon=1000/);
    await expect(section).toContainText('à moins de 1 km');
    await expect.poll(() => lieux.count()).toBeLessThan(autour);
    const proches = await lieux.count();

    await page.reload();
    await expect(lieux.first()).toBeVisible();
    await expect(lieux).toHaveCount(proches);
  });

  test('une autre ville : départ de Beaune, liste depuis Beaune, reste après un rechargement', async ({
    page,
    isMobile,
  }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    await page
      .getByRole('group', { name: /^Trajet :/ })
      .getByRole('button', { name: /^Départ :/ })
      .click();
    if (isMobile) {
      // Page « Trajet » (D085) : après le départ, le curseur passe à Destination ; « Retour » la ferme.
      const pageTrajet = page.getByRole('dialog', { name: 'Trajet' });
      await pageTrajet.getByRole('searchbox', { name: 'Départ' }).fill('Beaune');
      await pageTrajet.getByRole('button', { name: /^Beaune, Côte-d’Or/ }).click();
      await expect(pageTrajet.getByRole('searchbox', { name: 'Destination' })).toBeFocused();
      await pageTrajet.getByRole('button', { name: 'Retour' }).click();
    } else {
      const feuille = page.getByRole('dialog', { name: "D'où partez-vous ?" });
      await feuille.getByPlaceholder('Rechercher une ville ou une gare').fill('Beaune');
      await feuille.getByRole('button', { name: /^Beaune, Côte-d’Or/ }).click();
    }

    const titre = page.getByRole('heading', { name: /^En train direct depuis Beaune/ });
    await expect(titre).toBeVisible();
    await expect(page).toHaveURL(/gare=EX000002/);
    await expect(page.getByRole('button', { name: /^Départ : Au départ de Beaune/ })).toBeVisible();

    await page.reload();
    await expect(titre).toBeVisible();
    await expect(page.getByRole('button', { name: /^Départ : Au départ de Beaune/ })).toBeVisible();
  });
});

test.describe('Lieux', () => {
  const ECRAN = `/lieux?date=${DATE}`;
  const cartes = (page: Page) => page.getByRole('main').getByRole('listitem');

  test('temps de train : 30 min réduit la liste, reste après un rechargement', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(cartes(page).first()).toBeVisible();
    const tous = await cartes(page).count();

    await dansFiltres(page, (feuille) =>
      option(feuille, 'Temps de train maximum', '30 min').click(),
    );
    await expect(page).toHaveURL(/dureeMax=30/);
    await expect.poll(() => cartes(page).count()).toBeLessThan(tous);
    const reduits = await cartes(page).count();

    await page.reload();
    await expect(cartes(page).first()).toBeVisible();
    await expect(cartes(page)).toHaveCount(reduits);
  });
});
