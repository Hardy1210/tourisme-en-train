// Section « Près de… » d'Explorer (maquette v6) et mode destination : une destination choisie fait passer la
// section en bas, autour de sa gare (périmètre fixe des gares), donne le prochain train vers elle, et
// « Filtres » ne garde que « Quand ? ». Échantillon (db/echantillon/), sans réseau, position au centre de Dijon.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const DATE = '2026-11-18';
const ECRAN = `/?date=${DATE}`;
// Beaune (EX000002) choisie dans la recherche, comme après un toucher dans la liste (D084).
const AVEC_BEAUNE = `/?date=${DATE}&recherche=Beaune&destination=EX000002`;

test.use({ geolocation: { latitude: 47.3233, longitude: 5.0272 }, permissions: ['geolocation'] });

test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

const presDeVous = (page: Page) => page.getByRole('region', { name: 'Près de vous' });
const presDeBeaune = (page: Page) =>
  page.getByRole('region', { name: 'Près de la gare de Beaune' });
const titreTrains = (page: Page) =>
  page.getByRole('heading', { name: /^En train direct depuis Dijon-Ville/ });
const feuilleFiltres = (page: Page) => page.getByRole('dialog', { name: 'Filtres' });
const groupe = (page: Page, nom: string) =>
  feuilleFiltres(page).getByRole('radiogroup', { name: nom });

/** `a` est avant `b` dans la page. */
async function avant(a: ReturnType<Page['getByRole']>, b: ReturnType<Page['getByRole']>) {
  const poigneeB = await b.elementHandle();
  return a.evaluate(
    (elementA, elementB) =>
      elementB !== null &&
      (elementA.compareDocumentPosition(elementB) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    poigneeB,
  );
}

test('sans destination : « Près de vous » en haut, avant les trains', async ({ page }) => {
  await page.goto(ECRAN);
  await expect(presDeVous(page)).toBeAttached();
  await expect(titreTrains(page)).toBeAttached();
  expect(await avant(presDeVous(page), titreTrains(page))).toBe(true);
  await expect(presDeBeaune(page)).toHaveCount(0);
});

test('destination choisie : « Près de la gare de Beaune » en bas, à 1,5 km, et le train vers Beaune', async ({
  page,
}) => {
  await page.goto(AVEC_BEAUNE);
  const section = presDeBeaune(page);
  await expect(section).toBeAttached();
  await expect(presDeVous(page)).toHaveCount(0);
  expect(await avant(titreTrains(page), section)).toBe(true);
  await expect(section).toContainText('à moins de 1,5 km');
  await expect(section.getByRole('listitem').first()).toBeAttached();
  await expect(page.getByText('Prochain départ direct').locator('..')).toContainText('→ Beaune');
});

test('destination choisie : « Filtres » ne garde que « Quand ? », Réinitialiser ne touche que la date', async ({
  page,
}) => {
  await page.goto(`${AVEC_BEAUNE}&categories=enfants`);
  await page.getByRole('button', { name: /^Filtres/ }).click();
  await expect(feuilleFiltres(page).getByText('Quand ?')).toBeVisible();
  await expect(groupe(page, 'Distance autour de vous')).toHaveCount(0);
  await expect(groupe(page, 'Temps de train maximum')).toHaveCount(0);
  await expect(feuilleFiltres(page).getByText('Faisable dans la journée')).toHaveCount(0);

  await feuilleFiltres(page).getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page).not.toHaveURL(/date=/);
  await expect(page).toHaveURL(/categories=enfants/);
  await expect(page).toHaveURL(/destination=EX000002/);
});

test('sans destination : « Filtres » montre tout', async ({ page }) => {
  await page.goto(ECRAN);
  await page.getByRole('button', { name: /^Filtres/ }).click();
  await expect(groupe(page, 'Distance autour de vous')).toBeVisible();
  await expect(groupe(page, 'Temps de train maximum')).toBeVisible();
  await expect(feuilleFiltres(page).getByText('Faisable dans la journée')).toBeVisible();
});
