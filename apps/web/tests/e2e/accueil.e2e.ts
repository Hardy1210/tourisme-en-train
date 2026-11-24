// Accueil du premier lancement (D113) : la position n'est demandée qu'au toucher de « Utiliser ma
// position », jamais à l'ouverture ; aux lancements suivants, seulement après l'écran de lancement.
// Échantillon (données d'exemple, db/echantillon/), réseau extérieur coupé.
import { expect, test, type Page } from './test';
import { couperLeReseau } from './outils';

const DIJON_VILLE = { latitude: 47.3233, longitude: 5.0272 };

test.use({ accueilVu: false, geolocation: DIJON_VILLE, permissions: ['geolocation'] });

test.beforeEach(async ({ context, baseURL, page }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
  // Compte les demandes de position ; note si l'écran de lancement était encore là à ce moment.
  await page.addInitScript(() => {
    const fenetre = window as unknown as { demandes: number; lancementPendantDemande: string[] };
    fenetre.demandes = 0;
    fenetre.lancementPendantDemande = [];
    const lire = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = (...args) => {
      fenetre.demandes += 1;
      const ecran = document.querySelector('[data-ecran-lancement]');
      const style = ecran ? getComputedStyle(ecran) : null;
      fenetre.lancementPendantDemande.push(
        !style || style.display === 'none' || style.visibility === 'hidden' ? 'parti' : 'visible',
      );
      lire(...args);
    };
  });
});

const demandes = (page: Page) =>
  page.evaluate(() => (window as unknown as { demandes: number }).demandes);
const bienvenue = (page: Page) => page.getByRole('heading', { name: 'Que faire autour de vous ?' });
const ecranGare = (page: Page) => page.getByRole('heading', { name: 'Votre gare de départ' });

/** Premier lancement → « Utiliser ma position » → écran 3a, la gare trouvée. */
async function jusquALaGare(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Utiliser ma position' }).click();
  await expect(ecranGare(page)).toBeVisible();
  await expect(page.getByText('Dijon-Ville')).toBeVisible();
}

test('premier lancement : la bienvenue, sans demander la position ni montrer le menu', async ({
  page,
}) => {
  await page.goto('/');
  await expect(bienvenue(page)).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toHaveCount(0);
  expect(await demandes(page)).toBe(0);
});

test('« Utiliser ma position » : la demande part, puis l’écran de la gare et Explorer', async ({
  page,
}) => {
  await jusquALaGare(page);
  expect(await demandes(page)).toBe(1);
  await expect(
    page.getByText('La plus proche de vous. Vous pouvez en choisir une autre.'),
  ).toBeVisible();
  await expect(page.getByText(/≈ \d+ min à pied/)).toBeVisible();

  await page.getByRole('button', { name: 'Voir les sorties' }).click();
  await expect(ecranGare(page)).toBeHidden();
  await expect(page.getByText('Autour de Dijon').first()).toBeVisible();

  // L'accueil ne revient plus sur cet appareil.
  await page.reload();
  await expect(page.getByText('Autour de Dijon').first()).toBeVisible();
  await expect(bienvenue(page)).toHaveCount(0);
  await expect(ecranGare(page)).toHaveCount(0);
});

test('« Destination » : page « Trajet » (téléphone) ou feuille (ordinateur), prête à taper', async ({
  page,
  isMobile,
}) => {
  await jusquALaGare(page);
  await page.getByRole('button', { name: 'Destination' }).click();
  await expect(ecranGare(page)).toBeHidden();
  if (isMobile) await expect(page.getByRole('searchbox', { name: 'Destination' })).toBeFocused();
  else await expect(page.getByRole('dialog', { name: 'Où allez-vous ?' })).toBeVisible();
});

test('« Changer » : page « Trajet » (téléphone) ou feuille (ordinateur), sur le départ', async ({
  page,
  isMobile,
}) => {
  await jusquALaGare(page);
  await page.getByRole('button', { name: /Changer de gare de départ/ }).click();
  await expect(ecranGare(page)).toBeHidden();
  if (isMobile) await expect(page.getByRole('searchbox', { name: 'Départ' })).toBeFocused();
  else await expect(page.getByRole('dialog', { name: "D'où partez-vous ?" })).toBeVisible();
});

test('une ville tapée : l’écran de sa gare, sans demander la position', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Nom de ville ou de gare' }).fill('Beaune');
  await page
    .getByRole('button', { name: /Beaune/ })
    .first()
    .click();
  await expect(ecranGare(page)).toBeVisible();
  await expect(page.getByText('Vous pouvez en choisir une autre.', { exact: true })).toBeVisible();
  expect(await demandes(page)).toBe(0);
});

test('une gare suggérée : Explorer part de cette gare, sans demander la position', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('group', { name: 'Gares suggérées' }).getByRole('button').first().click();
  await expect(bienvenue(page)).toBeHidden();
  await expect(page).toHaveURL(/[?&]gare=\d{8}/);
  expect(await demandes(page)).toBe(0);
});

test('un lien avec une gare ouvre Explorer, même au premier lancement', async ({ page }) => {
  await page.goto('/?gare=EX000002');
  await expect(page.getByText('Au départ de Beaune').first()).toBeVisible();
  await expect(bienvenue(page)).toHaveCount(0);
  expect(await demandes(page)).toBe(0);
});

test('position refusée : « Dans quelle ville êtes-vous ? »', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_succes, echec) =>
      echec?.({
        code: 1,
        message: 'refus',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Utiliser ma position' }).click();
  await expect(page.getByRole('heading', { name: 'Dans quelle ville êtes-vous ?' })).toBeVisible();
});

test.describe('lancements suivants', () => {
  test.use({ accueilVu: true, ecranLancement: true });

  test('la position n’est demandée qu’une fois l’écran de lancement parti', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Autour de Dijon').first()).toBeVisible({ timeout: 10_000 });
    const moments = await page.evaluate(
      () => (window as unknown as { lancementPendantDemande: string[] }).lancementPendantDemande,
    );
    expect(moments).toEqual(['parti']);
  });
});
