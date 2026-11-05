// Parcours de l'écran Lieux, sur l'échantillon (données d'exemple, db/echantillon/). Sans réseau.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const DIJON_VILLE = { latitude: 47.3233, longitude: 5.0272 };
const DATE = '2026-11-18';
const ECRAN = `/lieux?date=${DATE}`;

// Une réponse encore en cours à la fin d'un test ne doit pas faire échouer le suivant.
test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

const cartes = (page: Page) => page.getByRole('main').getByRole('listitem');

test.describe('position acceptée', () => {
  test.use({ geolocation: DIJON_VILLE, permissions: ['geolocation'] });

  test('la liste montre gare, train et marche, puis ouvre la fiche du lieu', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(page.getByRole('heading', { name: 'Lieux à visiter' })).toBeVisible();
    await expect(page.getByText(/en train direct depuis Dijon-Ville/)).toBeVisible();
    const premiere = cartes(page).first();
    await expect(premiere).toContainText('en train direct');
    await expect(premiere).toContainText('min à pied');
    await premiere.getByRole('link').click();
    await expect(page).toHaveURL(/\/lieux\/[^?]+\?depuis=EX000001&date=2026-11-18/);
  });

  test('une catégorie réduit la liste, « Tout » la rétablit', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(cartes(page).first()).toBeVisible();
    const nombreInitial = await cartes(page).count();
    const categories = page.getByRole('group', { name: 'Catégories' });
    await categories.getByRole('button', { name: 'Enfants' }).click();
    await expect.poll(() => cartes(page).count()).toBeLessThan(nombreInitial);
    await categories.getByRole('button', { name: 'Tout' }).click();
    await expect(cartes(page)).toHaveCount(nombreInitial);
  });

  test('sans résultat : un message et « Tout afficher » rétablit la liste', async ({ page }) => {
    await page.route('**/api/lieux?*categories=*', (requete) =>
      requete.fulfill({ json: { lieux: [], total: 0, pageSuivante: null } }),
    );
    await page.goto(`${ECRAN}&categories=nature`);
    await expect(page.getByRole('heading', { name: 'Aucun lieu pour ces envies' })).toBeVisible();
    await page.getByRole('button', { name: 'Tout afficher' }).click();
    await expect(cartes(page).first()).toBeVisible();
  });

  test('« Voir plus » ajoute la page suivante, et disparaît à la fin', async ({ page }) => {
    await page.route('**/api/lieux?*', async (requete) => {
      const reponse = await requete.fetch();
      const corps = (await reponse.json()) as { lieux: unknown[]; total: number };
      const deuxieme = new URL(requete.request().url()).searchParams.get('page') === '2';
      await requete.fulfill({
        json: deuxieme
          ? { lieux: [], total: corps.total, pageSuivante: null }
          : { ...corps, pageSuivante: 2 },
      });
    });
    await page.goto(ECRAN);
    const voirPlus = page.getByRole('button', { name: 'Voir plus' });
    await voirPlus.click();
    await expect(voirPlus).toBeHidden();
    await expect(cartes(page).first()).toBeVisible();
  });

  test('une date hors des horaires propose de revenir à aujourd’hui', async ({ page }) => {
    await page.goto('/lieux?date=2020-01-01');
    await expect(page.getByRole('button', { name: /Revenir à aujourd/ })).toBeVisible();
  });

  test('la gare choisie et la date suivent entre Explorer et Lieux', async ({ page }) => {
    await page.goto('/?gare=EX000002&date=2026-11-18');
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Lieux' })
      .click();
    await expect(page).toHaveURL(/\/lieux\?gare=EX000002&date=2026-11-18/);
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Explorer' })
      .click();
    await expect(page).toHaveURL(/\/\?gare=EX000002&date=2026-11-18/);
  });
});

test.describe('position refusée', () => {
  test('propose de choisir, sans afficher de liste', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(page.getByRole('button', { name: 'Choisir une ville' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lieux à visiter' })).toBeHidden();
  });
});
