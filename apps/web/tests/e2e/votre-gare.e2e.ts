// Carte « Votre gare » : le trajet jusqu'à la gare de départ ne parle jamais de vélo, faute de preuve qu'on
// en a un près de soi (D096) ; « Voir l'itinéraire » ouvre l'application de cartes avec la gare seule.
// Échantillon, sans réseau ; projet mobile = Android (Google Maps).
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const ECRAN = '/?date=2026-11-18';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

// La carte est nommée par son titre, le nom de la gare (`aria-labelledby="votre-gare"`).
const carteVotreGare = (page: Page) => page.locator('[aria-labelledby="votre-gare"]');

test.describe('à côté de la gare', () => {
  test.use({ geolocation: { latitude: 47.3233, longitude: 5.0272 }, permissions: ['geolocation'] });

  test('durée à pied, pas de vélo, lien d’itinéraire vers la gare seule', async ({ page }) => {
    await page.goto(ECRAN);
    const carte = carteVotreGare(page);
    await expect(carte).toContainText('min à pied');
    await expect(carte).not.toContainText(/vélo/i);
    const lien = carte.getByRole('link', { name: 'Voir l’itinéraire' });
    const adresse = new URL((await lien.getAttribute('href')) ?? '');
    expect(adresse.searchParams.get('destination')).toMatch(/^47\.\d+,5\.\d+$/);
    expect([...adresse.searchParams.keys()].sort()).toEqual(['api', 'destination']);
  });
});

test.describe('loin de la gare', () => {
  test.use({ geolocation: { latitude: 47.36, longitude: 5.08 }, permissions: ['geolocation'] });

  test('la distance seule, ni durée à pied, ni vélo', async ({ page }) => {
    await page.goto(ECRAN);
    const carte = carteVotreGare(page);
    await expect(carte).toContainText(/\d+,\d km/);
    // Avant D096 : « 🚲 14 min · 3,6 km », le vélo n'étant qu'une icône. Aucune durée ne doit rester.
    await expect(carte).not.toContainText(/\d+ min/);
    await expect(carte).not.toContainText(/vélo/i);
    await expect(carte.getByRole('link', { name: 'Voir l’itinéraire' })).toBeVisible();
  });
});

test.describe('sur iPhone', () => {
  // Signature d'un iPhone : Chromium seul est installé pour les parcours, la signature suffit (D083).
  test.use({
    geolocation: { latitude: 47.3233, longitude: 5.0272 },
    permissions: ['geolocation'],
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });

  test('« Voir l’itinéraire » propose Plans ou Google Maps, la gare seule en destination', async ({
    page,
  }) => {
    await page.goto(ECRAN);
    await carteVotreGare(page).getByRole('button', { name: 'Voir l’itinéraire' }).click();
    const choix = page.getByRole('dialog', { name: 'Ouvrir l’itinéraire avec' });
    await expect(choix).toBeVisible();
    const plans = new URL(
      (await choix.getByRole('link', { name: /Plans/ }).getAttribute('href')) ?? '',
    );
    expect(plans.origin).toBe('https://maps.apple.com');
    expect(plans.searchParams.get('daddr')).toMatch(/^47\.\d+,5\.\d+$/);
    const google = new URL(
      (await choix.getByRole('link', { name: /Google Maps/ }).getAttribute('href')) ?? '',
    );
    expect(google.searchParams.get('destination')).toBe(plans.searchParams.get('daddr'));
  });
});
