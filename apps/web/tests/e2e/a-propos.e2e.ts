// Page « L'âme du produit » : atteinte depuis le menu, chiffres sourcés, sortie vers l'application.
import { expect, test } from './test';
import { couperLeReseau } from './outils';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

test('le menu mène à la page, et « Retour » revient', async ({ page }) => {
  await page.goto('/mon-espace');
  await page.getByRole('button', { name: 'Infos' }).click();
  await page.getByRole('link', { name: /À propos/ }).click();
  await expect(page).toHaveURL(/\/a-propos$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('30 secondes');
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page).toHaveURL(/\/mon-espace$/);
});

test('chaque chiffre affiché a sa source', async ({ page }) => {
  await page.goto('/a-propos');
  await expect(page.getByText('14 kg contre 2,8 kg')).toBeVisible();
  await expect(page.getByRole('link', { name: /Impact CO2 \(TER\)/ })).toHaveAttribute(
    'href',
    'https://impactco2.fr/outils/transport/ter',
  );
  await expect(page.getByText('97 Mt CO₂e')).toBeVisible();
  await expect(page.getByText('69 %')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Source : ADEME (nouvel onglet)' }).first(),
  ).toHaveAttribute('href', /ademe\.fr\/presse\/communique-national/);
});

test('les 3 étapes avec leur capture, « Pour qui » et « Ce que ça change »', async ({ page }) => {
  await page.goto('/a-propos');
  for (const titre of ['Comment ça marche', 'Pour qui', 'Ce que ça change'])
    await expect(page.getByRole('heading', { level: 2, name: titre })).toBeVisible();
  await expect(page.getByText('Tous ceux qui veulent sortir sans voiture.')).toBeVisible();
  // Chaque capture est chargée pour de vrai : une image absente garderait une largeur nulle.
  const captures = page.getByRole('img', { name: /^(Explorer|La page Lieux|La fiche de Beaune)/ });
  await expect(captures).toHaveCount(3);
  for (const capture of await captures.all()) {
    await capture.scrollIntoViewIfNeeded();
    await expect
      .poll(() => capture.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  }
});

test('« Ouvrir l’application » mène à Explorer', async ({ page }) => {
  await page.goto('/a-propos');
  await page.getByRole('link', { name: "Ouvrir l'application" }).click();
  await expect(page).toHaveURL(/\/(\?.*)?$/);
});
