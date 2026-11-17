// Photos des lieux à l'écran (D100, D101, D103), échantillon, sans réseau : les adresses d'exemple
// (example.org) sont servies ici par une petite image, sauf la photo « lente », qui ne répond jamais.
// L'icône de la catégorie est là tout de suite ; la photo se pose par-dessus si elle arrive à temps.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

// PNG d'un pixel, servi pour chaque photo d'exemple.
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

async function servirPhotos(context: BrowserContext, baseURL: string | undefined) {
  await couperLeReseau(context, baseURL);
  await context.route('https://example.org/photos/**', (requete) => {
    // La photo lente ne répond jamais : c'est la limite de temps qui doit trancher.
    if (requete.request().url().includes('/lente-')) return;
    return requete.fulfill({ contentType: 'image/png', body: PIXEL });
  });
}

test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

const cadrePhoto = (page: Page) => page.locator('[data-photo-etat]').first();

test.describe('fiche lieu', () => {
  test.beforeEach(({ context, baseURL }) => servirPhotos(context, baseURL));

  test('la photo s’affiche, avec la ligne de crédit et ses liens', async ({ page }) => {
    await page.goto('/lieux/echantillon-ECH_L02');
    await expect(page.getByRole('img', { name: 'Exemple - Jardin botanique' })).toBeVisible();
    await expect(cadrePhoto(page)).toHaveAttribute('data-photo-etat', 'affichee');
    const credit = page.getByText(/^Photo : Exemple Photographe/);
    await expect(credit).toContainText('CC BY-SA 4.0');
    await expect(page.getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-sa/4.0',
    );
  });

  test('limite : lieu sans photo → l’icône seule, aucune image ni crédit', async ({ page }) => {
    await page.goto('/lieux/echantillon-ECH_L01');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Aire de jeux du centre');
    await expect(page.locator('main img')).toHaveCount(0);
    await expect(page.getByText(/^Photo :/)).toHaveCount(0);
  });

  test('photo trop lente : l’icône tout de suite, puis l’abandon après la limite de temps', async ({
    page,
  }) => {
    await page.goto('/lieux/echantillon-ECH_L08');
    // Pas de carré vide : l'icône de la catégorie est là pendant l'attente.
    await expect(cadrePhoto(page).locator('svg')).toBeVisible();
    await expect(cadrePhoto(page)).toHaveAttribute('data-photo-etat', 'abandon', {
      timeout: 8000,
    });
    await expect(page.getByRole('img', { name: 'Exemple - Église romane' })).toHaveCount(0);
    await expect(cadrePhoto(page).locator('svg')).toBeVisible();
    // Sans photo affichée, pas de crédit à citer.
    await expect(page.getByText(/^Photo :/)).toHaveCount(0);
  });
});

test.describe('écran Lieux, depuis Dijon-Ville', () => {
  test.use({
    geolocation: { latitude: 47.3233, longitude: 5.0272 },
    permissions: ['geolocation'],
  });
  test.beforeEach(({ context, baseURL }) => servirPhotos(context, baseURL));

  test('ⓘ sur la carte d’un lieu : le crédit dans une bulle, sans ouvrir le lieu', async ({
    page,
  }) => {
    await page.goto('/lieux?date=2026-11-18');
    const carte = page
      .getByRole('main')
      .getByRole('listitem')
      .filter({ hasText: 'Exemple - Hospices' });
    await expect(carte.getByRole('img', { name: 'Exemple - Hospices' })).toBeVisible();
    const adresse = page.url();
    await carte.getByRole('button', { name: 'Crédit de la photo' }).click();
    await expect(
      page.getByText('Photo : Exemple Photographe · CC0 · Wikimedia Commons'),
    ).toBeVisible();
    expect(page.url()).toBe(adresse);
  });

  test('limite : une carte sans photo n’a pas de bouton de crédit', async ({ page }) => {
    await page.goto('/lieux?date=2026-11-18');
    const carte = page
      .getByRole('main')
      .getByRole('listitem')
      .filter({ hasText: 'Exemple - Remparts' });
    await expect(carte).toBeVisible();
    await expect(carte.getByRole('button', { name: 'Crédit de la photo' })).toHaveCount(0);
  });
});

// Décision de Hardy (18/11) : pas de ⓘ sur les petites cartes de « Près de vous » / « Près de la gare de… »,
// même pour DATAtourisme ; le crédit reste sur la page du lieu. Il reste sur l'écran Lieux (test plus haut).
test.describe('« Près de vous », à Dijon-Ville', () => {
  test.use({
    geolocation: { latitude: 47.3233, longitude: 5.0272 },
    permissions: ['geolocation'],
  });
  test.beforeEach(({ context, baseURL }) => servirPhotos(context, baseURL));

  test('la photo sur la carte, sans ⓘ ; le crédit est sur la page du lieu', async ({ page }) => {
    await page.goto('/?date=2026-11-18');
    const carte = page
      .getByRole('region', { name: 'Près de vous' })
      .getByRole('listitem')
      .filter({ hasText: 'Exemple - Jardin botanique' });
    await expect(carte.getByRole('img', { name: 'Exemple - Jardin botanique' })).toBeVisible();
    await expect(carte.getByRole('button', { name: 'Crédit de la photo' })).toHaveCount(0);
  });
});
