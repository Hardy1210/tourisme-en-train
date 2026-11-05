// PWA (D071) : installation, hors ligne, aucune position gardée, message si les scripts manquent.
// Échantillon (données d'exemple, db/echantillon/), sans réseau externe.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const DATE = '2026-11-18';
const ECRAN = `/?date=${DATE}`;
const BANDEAU = 'Vous êtes hors ligne : voici vos dernières recherches';
const SECOURS = 'Le chargement prend plus de temps que prévu.';
const PAS_DISPONIBLE = "Cette page n'est pas disponible hors ligne";

test.use({
  geolocation: { latitude: 47.3233, longitude: 5.0272 },
  permissions: ['geolocation'],
});

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

const sorties = (page: Page) => page.getByRole('link', { name: 'Voir la sortie' });

/** Le service worker contrôle la page ; rechargée, ses réponses passent par lui. */
async function installer(page: Page, adresse: string) {
  await page.goto(adresse);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await page.reload();
  await expect(sorties(page).first()).toBeVisible();
}

const adressesGardees = (page: Page) =>
  page.evaluate(async () => {
    const adresses: string[] = [];
    for (const nom of await caches.keys()) {
      for (const requete of await (await caches.open(nom)).keys()) adresses.push(requete.url);
    }
    return adresses;
  });

test.describe('avec le service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('le manifest et les icônes sont servis, et Chromium juge l’application installable', async ({
    page,
    request,
    context,
  }) => {
    const manifest = (await (await request.get('/manifest.webmanifest')).json()) as {
      display: string;
      icons: { src: string }[];
    };
    expect(manifest.display).toBe('standalone');
    for (const adresse of [...manifest.icons.map((i) => i.src), '/icones/apple-touch-icon.png']) {
      expect((await request.get(adresse)).status(), adresse).toBe(200);
    }
    await installer(page, ECRAN);
    const session = await context.newCDPSession(page);
    const { installabilityErrors } = await session.send('Page.getInstallabilityErrors');
    expect(installabilityErrors).toEqual([]);
  });

  test('en ligne : pas de bandeau', async ({ page }) => {
    await installer(page, ECRAN);
    await expect(page.getByText(BANDEAU)).toHaveCount(0);
  });

  test('hors ligne : la dernière liste et une fiche ouverte restent lisibles, avec le bandeau', async ({
    page,
    context,
  }) => {
    await installer(page, ECRAN);
    const lien = await sorties(page).first().getAttribute('href');
    await sorties(page).first().click();
    await expect(page).toHaveURL(/\/destinations\//);
    await expect(page.getByRole('tab').first()).toBeVisible();
    await page.goBack();
    await expect(sorties(page).first()).toBeVisible();

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText(BANDEAU)).toBeVisible();
    await expect(sorties(page).first()).toBeVisible();

    await page.goto(lien ?? '/');
    await expect(page.getByRole('tab').first()).toBeVisible();
  });

  test('hors ligne, une fiche jamais ouverte montre un message, la navigation reste là, et on peut revenir', async ({
    page,
    context,
  }) => {
    await installer(page, ECRAN);
    await context.setOffline(true);
    await sorties(page).nth(1).click();

    await expect(page.getByRole('heading', { name: PAS_DISPONIBLE })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
    await page.getByRole('button', { name: 'Revenir à Explorer' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(BANDEAU)).toBeVisible();
    await expect(page.getByRole('heading', { name: PAS_DISPONIBLE })).toHaveCount(0);
  });

  test('le réseau revient : la fiche demandée s’ouvre toute seule', async ({ page, context }) => {
    await installer(page, ECRAN);
    await context.setOffline(true);
    await sorties(page).nth(1).click();
    await expect(page.getByRole('heading', { name: PAS_DISPONIBLE })).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByRole('heading', { name: PAS_DISPONIBLE })).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(page.getByRole('tab').first()).toBeVisible();
  });

  test('le réseau revient : les données sont redemandées et le bandeau part, sans toucher à rien', async ({
    page,
    context,
  }) => {
    await installer(page, ECRAN);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText(BANDEAU)).toBeVisible();

    const requete = page.waitForRequest((r) => r.url().includes('/api/gares/proches'));
    await context.setOffline(false);
    await requete;
    await expect(page.getByText(BANDEAU)).toHaveCount(0);
    await expect(sorties(page).first()).toBeVisible();
  });

  test('aucune adresse gardée ne contient la position (règle 5)', async ({ page }) => {
    await installer(page, ECRAN);
    const adresses = await adressesGardees(page);
    expect(adresses.some((a) => a.includes('/api/destinations'))).toBe(true);
    expect(
      adresses.filter((a) => /[?&](lat|lon)=|\/api\/autour|\/api\/gares\/proches/.test(a)),
    ).toEqual([]);
  });

  test('hors ligne, un train déjà parti n’est pas affiché', async ({ page, context }) => {
    await page.clock.install({ time: new Date(`${DATE}T00:05:00+01:00`) });
    await installer(page, ECRAN);
    await expect(page.getByText(/Prochain :/).first()).toBeVisible();

    await context.setOffline(true);
    await page.clock.fastForward('23:50:00');
    await page.reload();
    await expect(page.getByText(BANDEAU)).toBeVisible();
    await expect(sorties(page).first()).toBeVisible();
    await expect(page.getByText(/Prochain :/)).toHaveCount(0);
  });
});

test.describe('si les scripts ne se chargent pas', () => {
  const opacite = (page: Page) =>
    page.getByText(SECOURS).evaluate((e) => Number(getComputedStyle(e.parentElement ?? e).opacity));

  test('un message propose de recharger, au lieu d’une page blanche', async ({ page }) => {
    await page.route('**/_next/static/chunks/**', (requete) => requete.abort());
    await page.goto(ECRAN);
    await expect.poll(() => opacite(page), { timeout: 12_000 }).toBe(1);
    await expect(page.getByRole('link', { name: 'Recharger la page' })).toBeVisible();
  });

  test('un chargement normal ne le montre jamais', async ({ page }) => {
    await page.goto(ECRAN);
    await expect(sorties(page).first()).toBeVisible();
    await expect(page.getByText(SECOURS)).toHaveCount(0);
  });
});
