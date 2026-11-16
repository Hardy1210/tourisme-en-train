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

const carteVotreGare = (page: Page) => page.getByRole('region', { name: /Dijon/ }).first();

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
    await expect(carte).not.toContainText('min à pied');
    await expect(carte).not.toContainText(/vélo/i);
    await expect(carte.getByRole('link', { name: 'Voir l’itinéraire' })).toBeVisible();
  });
});
