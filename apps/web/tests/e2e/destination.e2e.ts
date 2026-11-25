// Parcours de la fiche destination et de la fiche lieu, sur l'échantillon (données d'exemple, db/echantillon/).
import { expect, test, type Page } from './test';
import { couperLeReseau } from './outils';

const DIJON_VILLE = 'EX000001';
const BEAUNE = 'EX000002';
const LYON_HORS_REGION = 'EX000010';
const VELARS_SANS_LIEU = 'EX000024';
const DATE_HIVER = '2026-11-18';
const DATE_ETE = '2026-07-15';

const lien = (uic: string, date = DATE_HIVER) =>
  `/destinations/${uic}?depuis=${DIJON_VILLE}&date=${date}`;
const onglet = (page: Page, nom: string) => page.getByRole('tab', { name: nom });

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

test('Explorer → destination → onglet Trains : le dernier retour est visible', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 47.3233, longitude: 5.0272 });
  await page.goto(`/?date=${DATE_HIVER}`);
  await page.getByRole('link', { name: 'Voir la sortie' }).first().click();
  await expect(page).toHaveURL(/\/destinations\//);

  await onglet(page, 'Trains').click();
  await expect(page.getByText('Dernier retour')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Aller' }).getByRole('listitem').first(),
  ).toBeVisible();

  // La page « Trajet » fermée (D085) a aussi son « Retour », inerte : celui de la fiche est dans `main`.
  await page.getByRole('main').getByRole('button', { name: 'Retour' }).click();
  await expect(page.getByRole('heading', { name: /En train direct depuis/ })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`date=${DATE_HIVER}`));
});

for (const date of [DATE_HIVER, DATE_ETE]) {
  test(`Beaune (${date}) : lieux, trains, transports, CO₂ et prix estimé`, async ({ page }) => {
    await page.goto(lien(BEAUNE, date));
    await expect(page.getByRole('heading', { name: 'Beaune', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Acheter mon billet' })).toHaveAttribute(
      'rel',
      'noopener',
    );
    await expect(page.getByText(/Vous économisez/)).toBeVisible();
    await expect(page.getByText(/\(estimation\)/)).toBeVisible();
    await expect(page.getByText(/Exemple - /).first()).toBeVisible();

    await onglet(page, 'Trains').click();
    await expect(page.getByRole('region', { name: 'Aller' })).toBeVisible();

    await onglet(page, 'Sur place').click();
    await expect(page.getByText('Aucun transport repéré autour de cette gare')).toBeVisible();
  });
}

test('onglet Trains : « TER Mobigo » si les deux terminus sont en région, sinon « TER » (D082)', async ({
  page,
}) => {
  await page.goto(lien(BEAUNE));
  await onglet(page, 'Trains').click();
  const aller = page.getByRole('region', { name: 'Aller' });
  // ECH_T4 Dijon → Beaune : entièrement dans la région.
  await expect(aller.getByText(/TER Mobigo 891003/)).toBeVisible();
  // ECH_T1 (Dijon → Lyon) jumelé avec ECH_T26 : un trajet sort de la région.
  await expect(aller.getByText(/· TER 891001 \/ 891099/)).toBeVisible();
});

test('une gare avec des transports les liste par type, avec les lignes', async ({ page }) => {
  await page.goto(`/destinations/${DIJON_VILLE}?onglet=sur-place`);
  await expect(page.getByText(/Autour de la gare de/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bus' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Lignes' }).first()).toBeVisible();
});

test('« Comparer » détaille le CO₂ par mode de transport', async ({ page }) => {
  await page.goto(lien(BEAUNE));
  await page.getByRole('button', { name: 'Comparer' }).click();
  const liste = page.getByRole('list', { name: 'Émissions par mode de transport' });
  await expect(liste.getByText('Voiture seule')).toBeVisible();
  await expect(liste.getByText('Le plus sobre')).toBeVisible();
});

test('hors région : les trains, et un message honnête pour les lieux', async ({ page }) => {
  await page.goto(lien(LYON_HORS_REGION));
  await expect(
    page.getByText('Les lieux de cette destination ne sont pas encore disponibles'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voir les trains' }).click();
  await expect(page.getByRole('region', { name: 'Aller' })).toBeVisible();
  await expect(page).toHaveURL(/onglet=trains/);
});

test('dans la région, sans lieu : un autre message que le hors région', async ({ page }) => {
  await page.goto(lien(VELARS_SANS_LIEU));
  await expect(page.getByText('Aucun lieu repéré à pied de cette gare')).toBeVisible();
  await expect(page.getByText('pas encore disponibles')).toHaveCount(0);
});

test('prix non calibré : aucun prix, le bouton de billetterie reste', async ({ page }) => {
  await page.route(`**/api/destinations/${BEAUNE}?*`, async (requete) => {
    const reponse = await requete.fetch();
    const corps = await reponse.json();
    corps.liaison.prixEstime = null;
    await requete.fulfill({ response: reponse, json: corps });
  });
  await page.goto(lien(BEAUNE));
  await expect(page.getByRole('link', { name: 'Acheter mon billet' })).toBeVisible();
  // « ≈ » seul ne suffit plus : il précède aussi les minutes à pied (D102). On cherche un prix.
  await expect(page.getByText(/estimation|≈ \d+( à \d+)? €/)).toHaveCount(0);
});

// Fiche restée ouverte après minuit (D108) : « Demain » devient « Aujourd'hui » au retour au premier plan.
// 17/11, 23:59:50 à Paris (UTC+1) ; le 18/11 est un jour de l'échantillon.
const AVANT_MINUIT = '2026-11-17T22:59:50Z';
const APRES_MINUIT = '2026-11-17T23:00:10Z';
const boutonDate = (page: Page) =>
  page.getByRole('button', { name: /^(Demain|Aujourd’hui|Aujourd'hui)/ });
const revenirAuPremierPlan = (page: Page) =>
  page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

test('fiche ouverte pour demain : après minuit, elle dit « Aujourd’hui »', async ({ page }) => {
  await page.clock.setFixedTime(AVANT_MINUIT);
  await page.goto(lien(BEAUNE));
  await expect(boutonDate(page)).toHaveText(/^Demain/);

  await page.clock.setFixedTime(APRES_MINUIT);
  await revenirAuPremierPlan(page);
  await expect(boutonDate(page)).toHaveText(/^Aujourd/);
});

test('limite : avant minuit, la même fiche dit toujours « Demain »', async ({ page }) => {
  await page.clock.setFixedTime(AVANT_MINUIT);
  await page.goto(lien(BEAUNE));
  await expect(boutonDate(page)).toHaveText(/^Demain/);

  await revenirAuPremierPlan(page);
  await page.waitForTimeout(300);
  await expect(boutonDate(page)).toHaveText(/^Demain/);
});

test('une destination inconnue et une date hors horaires ont leur message', async ({ page }) => {
  await page.goto(`/destinations/INCONNUE?depuis=${DIJON_VILLE}`);
  await expect(page.getByText("Cette destination n'existe pas ou plus")).toBeVisible();

  await page.goto(lien(BEAUNE, '2020-01-01'));
  await expect(page.getByRole('button', { name: /Revenir à aujourd/ })).toBeVisible();
});

test('la fiche d’un lieu s’ouvre, propose le train et revient à la destination', async ({
  page,
}) => {
  await page.goto(lien(BEAUNE));
  await page
    .getByRole('link', { name: /Exemple - / })
    .first()
    .click();
  await expect(page).toHaveURL(/\/lieux\/.+\?depuis=EX000001&date=2026-11-18$/);
  await expect(page.getByRole('heading', { level: 1, name: /Exemple - / })).toBeVisible();

  await page.getByRole('link', { name: 'Y aller en train' }).click();
  await expect(page).toHaveURL(/onglet=trains/);
  await expect(page.getByRole('region', { name: 'Aller' })).toBeVisible();
});

test('le bouton repère met le lieu en avant sur la carte ; Échap referme la pilule', async ({
  page,
}) => {
  await page.goto(lien(BEAUNE));
  await page
    .getByRole('button', { name: /^Voir .+ sur la carte$/ })
    .first()
    .click();
  const carte = page.getByRole('region', { name: /Carte autour de la gare/ });
  await expect(carte.getByRole('button', { pressed: true })).toHaveCount(1);
  await expect(carte.getByRole('link', { name: /^Ouvrir la fiche de / })).toBeVisible();
  await expect(carte.getByRole('button', { name: 'Fermer' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(carte.getByRole('button', { pressed: true })).toHaveCount(0);
  await expect(carte.getByRole('link', { name: /^Ouvrir la fiche de / })).toHaveCount(0);
});

test('toute la pilule de la mini-carte ouvre la fiche du lieu', async ({ page }) => {
  await page.goto(lien(BEAUNE));
  await page
    .getByRole('button', { name: /^Voir .+ sur la carte$/ })
    .first()
    .click();
  const carte = page.getByRole('region', { name: /Carte autour de la gare/ });
  await carte.getByRole('link', { name: /^Ouvrir la fiche de / }).click();
  await expect(page).toHaveURL(/\/lieux\/.+\?depuis=EX000001&date=2026-11-18$/);
});

test('la fiche d’un lieu sans contexte de trajet ne propose pas le train', async ({ page }) => {
  await page.goto(lien(BEAUNE));
  const href = await page
    .getByRole('link', { name: /Exemple - / })
    .first()
    .getAttribute('href');
  await page.goto(String(href).split('?')[0] ?? '');
  await expect(page.getByRole('heading', { level: 1, name: /Exemple - / })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Y aller en train' })).toHaveCount(0);
});
