// Feuille d'Explorer (D122) : les `limites.destinationsParPage` premières destinations, puis « Voir plus »
// en ajoute autant. Toute la liste d'un coup (≈ 100 cartes) figeait la feuille et faisait planter Safari
// sur l'iPhone (25/11). L'échantillon a trop peu de destinations : sa réponse est allongée avec des
// copies nommées « Exemple n » (données d'exemple), le reste de l'écran est celui de l'échantillon.
import { parametres } from '../../src/config/parametres';
import { couperLeReseau } from './outils';
import { expect, test, type Page } from './test';

const ECRAN = '/?date=2026-11-18';
const PAR_PAGE = parametres.limites.destinationsParPage;

test.use({ geolocation: { latitude: 47.3233, longitude: 5.0272 }, permissions: ['geolocation'] });

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

/** La liste des destinations remplacée par `nombre` copies de la première, chacune avec sa gare. */
async function avecDestinations(page: Page, nombre: number) {
  await page.route('**/api/destinations?*', async (requete) => {
    const reponse = await requete.fetch();
    const corps = (await reponse.json()) as { destinations: Record<string, unknown>[] };
    const modele = corps.destinations[0]!;
    const gare = modele.gare as Record<string, unknown>;
    await requete.fulfill({
      json: {
        ...corps,
        destinations: Array.from({ length: nombre }, (_, i) => ({
          ...modele,
          titre: `Exemple ${i + 1}`,
          gare: { ...gare, uic: `EX9${String(i).padStart(5, '0')}`, nom: `Exemple ${i + 1}` },
          autresGares: [],
        })),
      },
    });
  });
}

const section = (page: Page) => page.getByRole('region', { name: /^En train direct depuis/ });
const cartes = (page: Page) => section(page).getByRole('link', { name: 'Voir la sortie' });
const voirPlus = (page: Page) => section(page).getByRole('button', { name: 'Voir plus' });
const titres = (page: Page) => section(page).getByRole('heading', { name: /^Exemple \d+$/ });

/** Le focus d'abord : sur téléphone, le bouton est en bas de la feuille, qu'il faut faire défiler. */
async function toucherVoirPlus(page: Page) {
  await voirPlus(page).focus();
  await voirPlus(page).click();
}

test('25 destinations : les 10 premières, puis « Voir plus » en ajoute 10, jusqu’à la fin', async ({
  page,
}) => {
  await avecDestinations(page, 25);
  await page.goto(ECRAN);
  await expect(cartes(page)).toHaveCount(PAR_PAGE);
  // Le compte annonce toute la liste, pas seulement ce qui est montré.
  await expect(
    section(page).getByText('25 destinations · triées par temps de trajet'),
  ).toBeVisible();
  await expect(titres(page).first()).toHaveText('Exemple 1');
  await expect(titres(page).last()).toHaveText(`Exemple ${PAR_PAGE}`);

  await toucherVoirPlus(page);
  await expect(cartes(page)).toHaveCount(2 * PAR_PAGE);
  await expect(titres(page).last()).toHaveText(`Exemple ${2 * PAR_PAGE}`);

  await toucherVoirPlus(page);
  await expect(cartes(page)).toHaveCount(25);
  await expect(voirPlus(page)).toHaveCount(0);
});

test('limite : 10 destinations tiennent sans « Voir plus »', async ({ page }) => {
  await avecDestinations(page, PAR_PAGE);
  await page.goto(ECRAN);
  await expect(cartes(page)).toHaveCount(PAR_PAGE);
  await expect(voirPlus(page)).toHaveCount(0);
});

test('limite : 11 destinations, « Voir plus » montre la dernière puis disparaît', async ({
  page,
}) => {
  await avecDestinations(page, PAR_PAGE + 1);
  await page.goto(ECRAN);
  await expect(cartes(page)).toHaveCount(PAR_PAGE);
  await toucherVoirPlus(page);
  await expect(cartes(page)).toHaveCount(PAR_PAGE + 1);
  await expect(voirPlus(page)).toHaveCount(0);
});
