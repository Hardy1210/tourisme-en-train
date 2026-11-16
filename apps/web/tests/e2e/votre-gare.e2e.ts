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

// Gare choisie à la main (`?gare=`) : pas de distance, mais il faut toujours y aller. Le lien ne porte que la
// gare (Beaune dans l'échantillon) : l'application de cartes part de sa propre position, même si Wagoo n'a
// pas eu l'accord pour la sienne (règle 5).
const BEAUNE = '/?gare=EX000002&date=2026-11-18';

async function attendreLienVersBeaune(page: Page) {
  const carte = carteVotreGare(page);
  await expect(carte).toContainText('Beaune');
  await expect(carte).not.toContainText(/\d+ min à pied|\d+,\d km|vélo/i);
  const lien = carte.getByRole('link', { name: 'Voir l’itinéraire' });
  const adresse = new URL((await lien.getAttribute('href')) ?? '');
  expect(adresse.searchParams.get('destination')).toMatch(/^47\.02\d*,4\.84\d*$/);
  expect([...adresse.searchParams.keys()].sort()).toEqual(['api', 'destination']);
}

test.describe('gare choisie à la main, position acceptée', () => {
  test.use({ geolocation: { latitude: 47.3233, longitude: 5.0272 }, permissions: ['geolocation'] });

  test('lien d’itinéraire vers la gare choisie, sans distance', async ({ page }) => {
    await page.goto(BEAUNE);
    await attendreLienVersBeaune(page);
  });
});

test.describe('gare choisie à la main, position refusée', () => {
  test('lien d’itinéraire quand même, la gare seule en destination', async ({ page }) => {
    await page.goto(BEAUNE);
    await attendreLienVersBeaune(page);
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

// Listes de gares proches (page « Trajet », téléphone) : la durée à vélo seulement avec sa preuve, un parking
// vélo à la gare (D097). À 3 km au nord de Dijon-Ville : trop loin à pied, à vélo dans le rayon.
test.describe('gares proches, à 3 km de Dijon-Ville', () => {
  test.use({ geolocation: { latitude: 47.3503, longitude: 5.0272 }, permissions: ['geolocation'] });

  test('Dijon-Ville a un parking vélo : « ≈ N min à vélo » et la preuve ; les autres : la distance', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'La page « Trajet » n’existe que sur téléphone.');
    await page.goto(ECRAN);
    await page
      .getByRole('group', { name: /^Trajet :/ })
      .getByRole('button', { name: /^Départ :/ })
      .click();
    const liste = page
      .getByRole('dialog', { name: 'Trajet' })
      .getByRole('region', { name: 'Gares proches de vous' });
    const dijon = liste.getByRole('button', { name: /^Dijon-Ville/ });
    await expect(dijon).toContainText('Parking vélo à la gare');
    await expect(dijon).toContainText(/≈ \d+ min à vélo/);
    const autre = liste.getByRole('button', { name: /^Dijon-Porte-Neuve/ });
    await expect(autre).toContainText(/\d+,\d km/);
    await expect(autre).not.toContainText(/vélo/i);
  });
});
