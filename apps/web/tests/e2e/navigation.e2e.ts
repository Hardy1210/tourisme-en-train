// Changer d'onglet ne recharge rien, et un train parti ne reste jamais à l'écran (D068).
// Échantillon (données d'exemple, db/echantillon/), sans réseau, horloge simulée pour les trains.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const DATE = '2026-11-18';

test.use({
  geolocation: { latitude: 47.3233, longitude: 5.0272 },
  permissions: ['geolocation'],
});

// Une réponse encore en cours à la fin d'un test ne doit pas faire échouer le suivant.
test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

const onglet = (page: Page, nom: string) =>
  page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: nom });
const sorties = (page: Page) => page.getByRole('link', { name: 'Voir la sortie' });
const demandes = (page: Page) =>
  page.evaluate(() => (window as unknown as { demandes: number }).demandes);

test.describe('position gardée en changeant d’onglet', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const fenetre = window as unknown as { demandes: number };
      fenetre.demandes = 0;
      const lire = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = (...args) => {
        fenetre.demandes += 1;
        lire(...args);
      };
    });
  });

  test('l’aller-retour ne redemande ni la position ni les destinations', async ({ page }) => {
    await page.goto(`/?date=${DATE}`);
    await expect(sorties(page).first()).toBeVisible();
    expect(await demandes(page)).toBe(1);

    const appels: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/destinations') || r.url().includes('/api/gares/proches')) {
        appels.push(r.url());
      }
    });

    await onglet(page, 'Lieux').click();
    await expect(page.getByRole('heading', { name: 'Lieux à visiter' })).toBeVisible();
    await expect(page.getByText(/On cherche ce qu/)).toBeHidden();
    await onglet(page, 'Explorer').click();
    await expect(sorties(page).first()).toBeVisible();

    expect(await demandes(page)).toBe(1);
    expect(appels).toEqual([]);
  });

  test('recharger la page redemande bien la position', async ({ page }) => {
    await page.goto(`/?date=${DATE}`);
    await expect(sorties(page).first()).toBeVisible();
    await page.reload();
    await expect(sorties(page).first()).toBeVisible();
    expect(await demandes(page)).toBe(1); // compteur remis à zéro par le rechargement : une nouvelle demande
  });
});

test.describe('un train parti ne reste pas affiché', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date(`${DATE}T08:00:00+01:00`) });
  });

  // La réponse annonce toujours 08:05, comme un cache qui garderait une réponse trop vieille.
  const annoncerHuitHeuresCinq = (page: Page) =>
    page.route('**/api/destinations?*', async (requete) => {
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

  test('avant le départ, le train reste affiché', async ({ page }) => {
    await annoncerHuitHeuresCinq(page);
    await page.goto(`/?date=${DATE}`);
    await expect(page.getByText('08:05 → 08:30').first()).toBeVisible();
    await page.clock.fastForward('04:00');
    await expect(page.getByText('08:05 → 08:30').first()).toBeVisible();
  });

  test('une autre date, choisie exprès, garde ses trains', async ({ page }) => {
    await annoncerHuitHeuresCinq(page);
    await page.goto('/?date=2026-07-15');
    await expect(page.getByText('08:05 → 08:30').first()).toBeVisible();
    await page.clock.fastForward('06:00');
    await expect(page.getByText('08:05 → 08:30').first()).toBeVisible();
  });

  test('après le départ, il disparaît, même si la réponse ne change pas', async ({ page }) => {
    await annoncerHuitHeuresCinq(page);
    await page.goto(`/?date=${DATE}`);
    await expect(page.getByText('08:05 → 08:30').first()).toBeVisible();
    await page.clock.fastForward('06:00');
    await expect(page.getByText('08:05 → 08:30')).toHaveCount(0);
    await expect(page.getByText('Prochain train : mise à jour…').first()).toBeVisible();
    await expect(page.getByText('Plus de train direct ce jour')).toHaveCount(0);
  });
});
