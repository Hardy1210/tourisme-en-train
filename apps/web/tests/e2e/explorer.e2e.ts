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

  test('la mini-fiche reste juste au-dessus de la feuille, baissée ou remontée', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'La feuille n’existe que sur mobile.');
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();

    const poignee = page.getByRole('button', { name: 'Déplacer le panneau des résultats' });
    const fiche = page.getByRole('button', { name: 'Fermer' }).locator('xpath=../..');
    // Espace entre le bas de la fiche et le haut de la feuille ; la fiche ne touche jamais les filtres.
    const ecartAvecLaFeuille = async () => {
      const cadre = await fiche.boundingBox();
      const feuille = await poignee.boundingBox();
      const filtres = await page.locator('header').first().boundingBox();
      if (!cadre || !feuille || !filtres) return Number.NaN;
      if (cadre.y < filtres.y + filtres.height) return Number.NaN;
      return feuille.y - (cadre.y + cadre.height);
    };
    const attendreFicheCollee = async () => {
      await expect.poll(ecartAvecLaFeuille).toBeGreaterThanOrEqual(24);
      await expect.poll(ecartAvecLaFeuille).toBeLessThanOrEqual(44);
    };

    await page.getByRole('button', { name: 'Carte plein écran' }).click();
    await marqueurs(page).filter({ visible: true }).first().click();
    await attendreFicheCollee();

    await page.getByRole('button', { name: 'Afficher la liste' }).click();
    await attendreFicheCollee();

    // Feuille tout en haut : la fiche se cache, et revient quand la feuille redescend.
    await poignee.press('ArrowUp');
    await expect(fiche).toBeHidden();
    await poignee.press('ArrowDown');
    await expect(fiche).toBeVisible();
    await attendreFicheCollee();
  });

  test('toucher un point demande les arrêts de son train, et pas avant', async ({ page }) => {
    const arrets: string[] = [];
    page.on('request', (requete) => {
      if (requete.url().includes('/api/trains/arrets')) arrets.push(requete.url());
    });
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    expect(arrets).toEqual([]);

    const pleinEcran = page.getByRole('button', { name: 'Carte plein écran' });
    if (await pleinEcran.isVisible()) await pleinEcran.click();
    const reponse = page.waitForResponse((r) => r.url().includes('/api/trains/arrets'));
    await marqueurs(page).filter({ visible: true }).first().click();
    expect((await reponse).status()).toBe(200);
  });

  test('une carte de la liste referme la mini-fiche ouverte, pas le reste', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    const pleinEcran = page.getByRole('button', { name: 'Carte plein écran' });
    const mobile = await pleinEcran.isVisible();
    if (mobile) await pleinEcran.click();

    const fermer = page.getByRole('button', { name: 'Fermer' });
    await marqueurs(page).filter({ visible: true }).first().click();
    await expect(fermer).toBeVisible();
    // La souris sur le point lui-même ne la referme pas.
    await page.waitForTimeout(100);
    await expect(fermer).toBeVisible();

    if (mobile) await page.getByRole('button', { name: 'Afficher la liste' }).click();
    await page.getByRole('heading', { name: 'Beaune' }).last().hover();
    await expect(fermer).toHaveCount(0);
  });

  test('la mention de la carte tient sur une ligne, et ses liens répondent', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();

    const lien = page.getByRole('link', { name: '© OpenStreetMap' }).filter({ visible: true });
    await expect(lien).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
    // Le parent laisse passer le toucher vers la carte : le lien doit quand même le recevoir.
    await lien.click({ trial: true });

    const hauteur =
      (await lien.locator('xpath=..').boundingBox())?.height ?? Number.POSITIVE_INFINITY;
    expect(hauteur).toBeLessThan(28);
  });

  // Prix calibré : chaque carte de destination le montre, avec la mention « estimation » (règle 7).
  test('prix calibré : les cartes de destination affichent le prix estimé', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    await expect(page.getByLabel(/^Prix estimé pour un aller/).first()).toBeVisible();
    await expect(page.getByText(/l.aller \(estimation\)/).first()).toBeVisible();
  });

  // Prix non calibré (`prixEstime: null`) : aucune ligne de prix, les cartes restent complètes.
  test('prix non calibré : aucune ligne de prix dans les cartes de destination', async ({
    page,
  }) => {
    await page.route('**/api/destinations?*', async (requete) => {
      const reponse = await requete.fetch();
      const corps = await reponse.json();
      for (const destination of corps.destinations) destination.prixEstime = null;
      await requete.fulfill({ response: reponse, json: corps });
    });
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    await expect(page.getByLabel(/^Prix estimé pour un aller/)).toHaveCount(0);
    await expect(page.getByText(/estimation|€/)).toHaveCount(0);
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

test.describe('gare proposée qui n’est pas la plus proche (D064)', () => {
  test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));
  test.use({ geolocation: { latitude: 47.343, longitude: 5.003 }, permissions: ['geolocation'] });

  test('dit le temps à pied, montre la plus proche, et y revient d’un geste', async ({ page }) => {
    // La route choisit sur les trains du jour réel, absents de l'échantillon : réponse simulée.
    await page.route('**/api/gares/proches*', async (requete) => {
      const reponse = await requete.fetch();
      const corps = (await reponse.json()) as Record<string, unknown>;
      await requete.fulfill({ json: { ...corps, uicConseille: 'EX000001' } });
    });
    await page.goto(ECRAN);
    await expect(titreDestinations(page)).toBeVisible();
    await expect(page.getByText(/min à pied ·/).first()).toBeVisible();
    await expect(page.getByText(/Gare la plus proche/)).toContainText('Dijon-Porte-Neuve');

    await page.getByRole('button', { name: 'Partir de Dijon-Porte-Neuve' }).click();

    await expect(
      page.getByRole('heading', { name: 'En train direct depuis Dijon-Porte-Neuve' }),
    ).toBeVisible();
    expect(new URL(page.url()).searchParams.get('gare')).toBe('EX000023');
    await expect(page.getByText(/Gare la plus proche/)).toHaveCount(0);
  });
});

test.describe('gare proposée qui est la plus proche', () => {
  test.use({ geolocation: DIJON_VILLE, permissions: ['geolocation'] });

  test('n’ajoute ni le temps à pied ni le bouton', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(titreDestinations(page)).toBeVisible();
    await expect(page.getByText(/Gare la plus proche/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Partir de/ })).toHaveCount(0);
  });
});
