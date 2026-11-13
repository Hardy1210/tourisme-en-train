// La date vit dans « Filtres » (D086) : en-tête sans logo ni bouton date sur téléphone ; pastille, compteur
// et fin de titre quand la date n'est pas aujourd'hui. Échantillon, sans réseau, horloge simulée.
import { expect, test, type Page } from '@playwright/test';
import { marque } from '../../src/config/marque';
import { couperLeReseau } from './outils';

// Mercredi : demain = jeudi 19, ce week-end = samedi 21.
const DATE = '2026-11-18';

test.use({
  geolocation: { latitude: 47.3233, longitude: 5.0272 },
  permissions: ['geolocation'],
});

test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

test.beforeEach(async ({ context, baseURL, page }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
  await page.clock.install({ time: new Date(`${DATE}T08:00:00+01:00`) });
});

const boutonFiltres = (page: Page) => page.getByRole('button', { name: /^Filtres/ });
const feuille = (page: Page) => page.getByRole('dialog', { name: /^(Filtres|Choisir une date)$/ });
const quand = (page: Page) => feuille(page).getByRole('group', { name: 'Quand ?' });
const pastille = (page: Page) => page.getByRole('button', { name: /^Date : / });

async function choisirDansQuand(page: Page, choix: RegExp, fermer: string) {
  await boutonFiltres(page).click();
  await quand(page).getByRole('button', { name: choix }).click();
  await feuille(page).getByRole('button', { name: fermer }).click();
  await expect(feuille(page)).toHaveCount(0);
}

test.describe('Explorer', () => {
  const ECRAN = `/?date=${DATE}`;
  const titre = (page: Page) => page.getByRole('heading', { name: /^En train direct depuis/ });

  test('en-tête : ni bouton date ; logo sur ordinateur seulement', async ({ page, isMobile }) => {
    await page.goto(ECRAN);
    await expect(titre(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /Aujourd/ })).toHaveCount(0);
    const logo = page.locator('header').getByText(marque.nom);
    if (isMobile) await expect(logo).toBeHidden();
    else await expect(logo).toBeVisible();
  });

  test('aujourd’hui : ni pastille, ni compteur, ni date dans le titre', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(titre(page)).toHaveText('En train direct depuis Dijon-Ville');
    await expect(pastille(page)).toHaveCount(0);
    await expect(boutonFiltres(page)).toHaveAccessibleName('Filtres');
  });

  test('« Ce week-end » : pastille, compteur +1, titre « · ce week-end »', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(titre(page)).toBeVisible();
    await choisirDansQuand(page, /^Ce week-end/, 'Voir les sorties');
    await expect(page).toHaveURL(/date=2026-11-21/);
    await expect(pastille(page)).toHaveAccessibleName("Date : Ce week-end. Revenir à aujourd'hui");
    await expect(boutonFiltres(page)).toHaveAccessibleName('Filtres, 1 actif');
    await expect(titre(page)).toHaveText('En train direct depuis Dijon-Ville · ce week-end');
  });

  test('le ✕ de la pastille revient à aujourd’hui', async ({ page }) => {
    await page.goto('/?date=2026-11-19');
    await expect(pastille(page)).toHaveAccessibleName("Date : Demain. Revenir à aujourd'hui");
    await pastille(page).click();
    await expect(pastille(page)).toHaveCount(0);
    await expect(page).not.toHaveURL(/date=/);
    await expect(boutonFiltres(page)).toHaveAccessibleName('Filtres');
  });

  test('« Réinitialiser » remet aussi la date à aujourd’hui', async ({ page }) => {
    await page.goto('/?date=2026-11-19');
    await expect(pastille(page)).toBeVisible();
    await boutonFiltres(page).click();
    await feuille(page).getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(page).not.toHaveURL(/date=/);
    await expect(quand(page).getByRole('button', { name: /^Aujourd/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('« Choisir une date » : calendrier dans la même feuille, « Retour », puis une date', async ({
    page,
  }) => {
    // L'échantillon n'a d'horaires que jusqu'au 18 : on ouvre le calendrier jusqu'à mi-décembre.
    await page.route('**/api/sources', async (requete) => {
      const reponse = await requete.fetch();
      const corps = (await reponse.json()) as { horaires: { fin: string } };
      await requete.fulfill({
        json: { ...corps, horaires: { ...corps.horaires, fin: '2026-12-13' } },
      });
    });
    await page.goto(ECRAN);
    await expect(titre(page)).toBeVisible();
    await boutonFiltres(page).click();
    await quand(page)
      .getByRole('button', { name: /^Choisir une date/ })
      .click();
    // La même feuille, dont le titre change : pas de deuxième feuille par-dessus.
    await expect(feuille(page)).toHaveCount(1);
    await expect(feuille(page)).toHaveAccessibleName('Choisir une date');
    await feuille(page).getByRole('button', { name: 'Retour' }).click();
    await expect(quand(page)).toBeVisible();

    await quand(page)
      .getByRole('button', { name: /^Choisir une date/ })
      .click();
    await feuille(page)
      .getByRole('button', { name: /24 novembre/ })
      .click();
    // Le calendrier se valide : on revient alors aux filtres.
    await feuille(page)
      .getByRole('button', { name: /^Voir les sorties du/ })
      .click();
    await expect(quand(page).getByRole('button', { name: /^Choisir une date/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await feuille(page).getByRole('button', { name: 'Voir les sorties' }).click();
    await expect(pastille(page)).toHaveAccessibleName("Date : Mar. 24 nov. Revenir à aujourd'hui");
    await expect(titre(page)).toHaveText('En train direct depuis Dijon-Ville · mar. 24 nov.');
  });
});

test.describe('Lieux', () => {
  const ECRAN = `/lieux?date=${DATE}`;

  test('« Filtres » : « Quand ? » et la durée seulement ; « Demain » donne la pastille', async ({
    page,
    isMobile,
  }) => {
    await page.goto(ECRAN);
    await expect(page.getByText(/en train direct depuis Dijon-Ville\.$/)).toBeVisible();
    if (isMobile) await expect(page.locator('header').getByText(marque.nom)).toBeHidden();
    await boutonFiltres(page).click();
    await expect(quand(page)).toBeVisible();
    await expect(feuille(page).getByText('Distance autour de vous')).toHaveCount(0);
    await quand(page)
      .getByRole('button', { name: /^Demain/ })
      .click();
    await feuille(page).getByRole('button', { name: 'Voir les lieux' }).click();
    await expect(pastille(page)).toHaveAccessibleName("Date : Demain. Revenir à aujourd'hui");
    await expect(boutonFiltres(page)).toHaveAccessibleName('Filtres, 1 actif');
    await expect(page.getByText(/en train direct depuis Dijon-Ville · demain\.$/)).toBeVisible();
  });
});
