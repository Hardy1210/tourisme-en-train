// Parcours de l'écran Lieux, sur l'échantillon (données d'exemple, db/echantillon/). Sans réseau.
import { expect, test, type Page } from './test';
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
/** La rangée d'une gare, par son titre (D121). */
const rangee = (page: Page, gare: string) => page.getByRole('region', { name: gare, exact: true });

test.describe('position acceptée', () => {
  test.use({ geolocation: DIJON_VILLE, permissions: ['geolocation'] });

  test('une rangée par gare : son temps de train, ses lieux à pied ; un lieu ouvre sa fiche', async ({
    page,
  }) => {
    await page.goto(ECRAN);
    await expect(page.getByRole('heading', { name: 'Lieux à visiter' })).toBeVisible();
    await expect(page.getByText(/en train direct depuis Dijon-Ville/)).toBeVisible();
    const beaune = rangee(page, 'Beaune');
    await expect(beaune).toContainText('22 min');
    const premiere = beaune.getByRole('listitem').first();
    await expect(premiere).toContainText(/≈ \d+ min à pied/);
    await premiere.getByRole('link').click();
    await expect(page).toHaveURL(/\/lieux\/[^?]+\?depuis=EX000001&date=2026-11-18/);
  });

  test('« Voir tout » ouvre la fiche destination de la gare, avec le départ et la date', async ({
    page,
  }) => {
    await page.goto(ECRAN);
    await rangee(page, 'Beaune')
      .getByRole('link', { name: 'Voir tous les lieux de Beaune' })
      .click();
    await expect(page).toHaveURL(/\/destinations\/EX000002\?depuis=EX000001&date=2026-11-18/);
  });

  test('les lieux d’une rangée défilent de côté, la page ne défile pas en largeur', async ({
    page,
  }) => {
    await page.goto(ECRAN);
    const liste = rangee(page, 'Beaune').getByRole('list');
    await expect(liste).toHaveCSS('overflow-x', 'auto');
    const largeurs = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      ecran: document.documentElement.clientWidth,
    }));
    expect(largeurs.page).toBeLessThanOrEqual(largeurs.ecran);
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
    await page.route('**/api/lieux/rangees?*categories=*', (requete) =>
      requete.fulfill({ json: { rangees: [], total: 0, totalRangees: 0, pageSuivante: null } }),
    );
    await page.goto(`${ECRAN}&categories=nature`);
    await expect(page.getByRole('heading', { name: 'Aucun lieu pour ces envies' })).toBeVisible();
    await page.getByRole('button', { name: 'Tout afficher' }).click();
    await expect(cartes(page).first()).toBeVisible();
  });

  test('« Voir plus » ajoute la page suivante, et disparaît à la fin', async ({ page }) => {
    await page.route('**/api/lieux/rangees?*', async (requete) => {
      const reponse = await requete.fetch();
      const corps = (await reponse.json()) as { total: number; totalRangees: number };
      const deuxieme = new URL(requete.request().url()).searchParams.get('page') === '2';
      await requete.fulfill({
        json: deuxieme
          ? {
              rangees: [],
              total: corps.total,
              totalRangees: corps.totalRangees,
              pageSuivante: null,
            }
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
    await expect(page.getByRole('button', { name: /^Revenir à aujourd/ })).toBeVisible();
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

// Départ sur téléphone : la page plein écran d'Explorer (D085), réduite au champ Départ ; la barre de
// Lieux ne change pas. Sur ordinateur, la feuille « D'où partez-vous ? » reste.
test.describe('choix du départ', () => {
  test.use({ geolocation: DIJON_VILLE, permissions: ['geolocation'] });
  const pageDepart = (page: Page) => page.getByRole('dialog', { name: "D'où partez-vous ?" });
  const boutonDepart = (page: Page) => page.getByRole('button', { name: /^(Autour|Au départ) de/ });

  test('téléphone : page plein écran, curseur dans Départ, sans Destination', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'La page n’existe que sur téléphone.');
    await page.goto(ECRAN);
    await boutonDepart(page).click();
    await expect(pageDepart(page).getByRole('searchbox', { name: 'Départ' })).toBeFocused();
    await expect(pageDepart(page).getByRole('searchbox', { name: 'Destination' })).toHaveCount(0);
    await expect(pageDepart(page).getByRole('button', { name: /^Ma position/ })).toBeVisible();
    await expect(pageDepart(page).getByText('Gares proches de vous')).toBeVisible();
    const cadre = await pageDepart(page).boundingBox();
    expect(cadre?.height ?? 0).toBeGreaterThan((page.viewportSize()?.height ?? 0) - 2);
  });

  test('téléphone : une gare choisie ferme la page et change la liste', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'La page n’existe que sur téléphone.');
    await page.goto(ECRAN);
    await expect(page.getByText(/en train direct depuis Dijon-Ville/)).toBeVisible();
    await boutonDepart(page).click();
    await pageDepart(page)
      .getByRole('button', { name: /^Dijon-Porte-Neuve/ })
      .click();
    await expect(pageDepart(page)).toHaveAttribute('inert', '');
    await expect(pageDepart(page)).toHaveCSS('opacity', '0');
    await expect(boutonDepart(page)).toContainText('Dijon-Porte-Neuve');
  });

  test('téléphone : « Retour » ferme la page sans changer le départ', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'La page n’existe que sur téléphone.');
    await page.goto(ECRAN);
    await expect(boutonDepart(page)).toBeVisible();
    const avant = await boutonDepart(page).textContent();
    await boutonDepart(page).click();
    await pageDepart(page).getByRole('button', { name: 'Retour' }).click();
    await expect(pageDepart(page)).toHaveAttribute('inert', '');
    await expect(boutonDepart(page)).toHaveText(avant ?? '');
  });

  test('ordinateur : la feuille « D’où partez-vous ? » reste', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sur téléphone, c’est la page plein écran.');
    await page.goto(ECRAN);
    await boutonDepart(page).click();
    // La page plein écran, cachée sur grand écran, n'est pas dans l'arbre d'accessibilité : seule la
    // feuille répond, avec son champ de recherche.
    await expect(pageDepart(page)).toBeVisible();
    await expect(pageDepart(page)).not.toHaveAttribute('inert');
  });
});
