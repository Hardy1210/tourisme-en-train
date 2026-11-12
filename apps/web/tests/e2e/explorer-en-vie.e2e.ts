// Explorer gardé en vie (D069) : caché, aucun appel ; au retour, mise à jour seulement si c'est utile.
// Échantillon (données d'exemple, db/echantillon/), sans réseau, horloge simulée.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const DATE = '2026-11-18';
const ECRAN = `/?date=${DATE}`;

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

const onglet = (page: Page, nom: string) =>
  page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: nom });
const sorties = (page: Page) => page.getByRole('link', { name: 'Voir la sortie' });

/** Les appels propres à Explorer : `/api/lieux` et les autres servent aussi à l'écran Lieux. */
function appelsExplorer(page: Page): string[] {
  const appels: string[] = [];
  page.on('request', (requete) => {
    const url = requete.url();
    if (url.includes('/api/destinations') || url.includes('/api/autour')) appels.push(url);
  });
  return appels;
}

async function allerSurLieux(page: Page) {
  await onglet(page, 'Lieux').click();
  await expect(page.getByRole('heading', { name: 'Lieux à visiter' })).toBeVisible();
}

test('caché, Explorer ne fait aucun appel, même si le temps passe ou l’adresse change', async ({
  page,
}) => {
  await page.goto(ECRAN);
  await expect(sorties(page).first()).toBeVisible();
  const appels = appelsExplorer(page);

  await allerSurLieux(page);
  await page
    .getByRole('group', { name: 'Catégories' })
    .getByRole('button', { name: 'Enfants' })
    .click();
  await expect(page).toHaveURL(/categories=enfants/);
  await page.clock.fastForward('03:00');
  await page.clock.fastForward('03:00');
  await expect(page.getByRole('heading', { name: 'Lieux à visiter' })).toBeVisible();

  expect(appels).toEqual([]);
});

test('visible, le même Explorer se met à jour avec le temps', async ({ page }) => {
  await page.goto(ECRAN);
  await expect(sorties(page).first()).toBeVisible();
  const appels = appelsExplorer(page);
  await page.clock.fastForward('03:00');
  await expect
    .poll(() => appels.filter((u) => u.includes('/api/destinations')).length)
    .toBeGreaterThan(0);
});

test('retour avant la fin de la durée, mêmes filtres : aucun appel, et la même carte', async ({
  page,
}) => {
  await page.goto(ECRAN);
  await expect(sorties(page).first()).toBeVisible();
  await page.locator('canvas.maplibregl-canvas').evaluate((c) => c.setAttribute('data-essai', '1'));
  const appels = appelsExplorer(page);

  await allerSurLieux(page);
  await page.clock.fastForward('00:30');
  await onglet(page, 'Explorer').click();
  await expect(sorties(page).first()).toBeVisible();

  expect(appels).toEqual([]);
  await expect(page.locator('canvas.maplibregl-canvas[data-essai="1"]')).toHaveCount(1);
});

test('retour après la fin de la durée : les trains sont redemandés', async ({ page }) => {
  await page.goto(ECRAN);
  await expect(sorties(page).first()).toBeVisible();
  await allerSurLieux(page);
  await page.clock.fastForward('01:01');

  const requete = page.waitForRequest((r) => r.url().includes('/api/destinations'));
  await onglet(page, 'Explorer').click();
  await requete;
});

test('retour avec une autre date : les trains de cette date sont demandés', async ({ page }) => {
  await page.goto(ECRAN);
  await expect(sorties(page).first()).toBeVisible();
  await allerSurLieux(page);
  const appels = appelsExplorer(page);

  // La date se choisit dans « Filtres » (D086).
  await page.getByRole('button', { name: /^Filtres/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Demain/ })
    .click();
  await expect(page).toHaveURL(/date=2026-11-19/);
  await page.getByRole('dialog').getByRole('button', { name: 'Voir les lieux' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(appels).toEqual([]);

  const requete = page.waitForRequest(
    (r) => r.url().includes('/api/destinations') && r.url().includes('date=2026-11-19'),
  );
  await onglet(page, 'Explorer').click();
  await requete;
});

test('un filtre choisi sur Explorer est encore là au retour, sans aucun appel', async ({
  page,
}) => {
  await page.goto(ECRAN);
  await expect(sorties(page).first()).toBeVisible();
  const categories = page.getByRole('group', { name: 'Catégories' });
  await categories.getByRole('button', { name: 'Enfants' }).click();
  await expect(page).toHaveURL(/categories=enfants/);
  await expect(sorties(page).first()).toBeVisible();
  const appels = appelsExplorer(page);

  await allerSurLieux(page);
  await expect(page).not.toHaveURL(/categories=/);
  await onglet(page, 'Explorer').click();

  await expect(page).toHaveURL(/categories=enfants/);
  await expect(categories.getByRole('button', { name: 'Enfants' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(appels).toEqual([]);
});

test('un filtre de Lieux est encore là au retour, sans toucher à ceux d’Explorer', async ({
  page,
}) => {
  await page.goto(ECRAN);
  await expect(sorties(page).first()).toBeVisible();
  await allerSurLieux(page);
  await page
    .getByRole('group', { name: 'Catégories' })
    .getByRole('button', { name: 'Nature' })
    .click();
  await expect(page).toHaveURL(/\/lieux\?.*categories=nature/);

  await onglet(page, 'Explorer').click();
  await expect(sorties(page).first()).toBeVisible();
  await expect(page).not.toHaveURL(/categories=/);

  await onglet(page, 'Lieux').click();
  await expect(page).toHaveURL(/\/lieux\?.*categories=nature/);
});

test('un filtre changé au retour est bien demandé', async ({ page }) => {
  await page.goto(ECRAN);
  await expect(sorties(page).first()).toBeVisible();
  await allerSurLieux(page);
  await onglet(page, 'Explorer').click();
  await expect(sorties(page).first()).toBeVisible();

  const requete = page.waitForRequest(
    (r) => r.url().includes('/api/destinations') && r.url().includes('categories=enfants'),
  );
  await page
    .getByRole('group', { name: 'Catégories' })
    .getByRole('button', { name: 'Enfants' })
    .click();
  await requete;
});

test('un train parti pendant qu’Explorer était caché n’est jamais montré au retour', async ({
  page,
}) => {
  // La réponse annonce toujours 08:05, comme un cache qui garderait une réponse trop vieille.
  await page.route('**/api/destinations?*', async (requete) => {
    const reponse = await requete.fetch();
    const corps = (await reponse.json()) as { destinations: Record<string, unknown>[] };
    await requete.fulfill({
      json: {
        ...corps,
        destinations: corps.destinations.map((d) => ({
          ...d,
          prochainDepart: { s: 29_100, texte: '08:05', lendemain: false },
          prochaineArrivee: { s: 30_600, texte: '08:30', lendemain: false },
        })),
      },
    });
  });
  await page.goto(ECRAN);
  await expect(page.getByText('08:05 → 08:30').first()).toBeVisible();
  await allerSurLieux(page);
  await page.clock.fastForward('06:00');

  await onglet(page, 'Explorer').click();
  await expect(sorties(page).first()).toBeVisible();
  await expect(page.getByText('08:05 → 08:30')).toHaveCount(0);
});
