// Écran « Sources » : atteint depuis le menu, chaque source citée, avec sa licence et son lien (règle 8).
import { expect, test, type Page } from '@playwright/test';
import { sources } from '@tourisme/commun';
import { couperLeReseau } from './outils';

const AFFICHEES = sources.sources.filter((s) => s.affichee);

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

const ouvrirDepuisLeMenu = async (page: Page) => {
  await page.goto('/mon-espace');
  await page.getByRole('button', { name: 'Infos' }).click();
  await page.getByRole('link', { name: /Sources des données/ }).click();
  await expect(page).toHaveURL(/\/sources$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Sources des données' })).toBeVisible();
};

test('le menu mène à l’écran, le menu se referme et « Retour » revient', async ({ page }) => {
  await ouvrirDepuisLeMenu(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page).toHaveURL(/\/mon-espace$/);
});

test('chaque source affichée a sa licence, son attribution et son lien', async ({ page }) => {
  await ouvrirDepuisLeMenu(page);
  await expect(page.getByRole('link', { name: /^Voir la source/ })).toHaveCount(AFFICHEES.length);
  for (const source of AFFICHEES) {
    const carte = page.getByRole('article').filter({
      has: page.getByRole('heading', { level: 3, name: source.nom, exact: true }),
    });
    await expect(carte).toContainText(source.licence);
    await expect(carte).toContainText(source.attribution);
    await expect(carte.getByRole('link')).toHaveAttribute('href', source.page);
  }
});

test('une source non utilisée n’est pas citée', async ({ page }) => {
  await ouvrirDepuisLeMenu(page);
  for (const source of sources.sources.filter((s) => !s.affichee)) {
    await expect(
      page.getByRole('heading', { level: 3, name: source.nom, exact: true }),
    ).toHaveCount(0);
  }
});

test('l’attribution du fond de carte et le défi sont mentionnés', async ({ page }) => {
  await ouvrirDepuisLeMenu(page);
  const encadre = page.getByRole('complementary');
  await expect(encadre.getByRole('link', { name: '© OpenStreetMap' })).toBeVisible();
  await expect(encadre).toContainText('Tourisme en train');
  await expect(encadre).toContainText('jamais votre position');
});

test('une panne de l’API propose de réessayer, sans détail technique', async ({ page }) => {
  await page.route('**/api/sources', (requete) =>
    requete.fulfill({ status: 500, json: { erreur: { code: 'INTERNE', message: 'x' } } }),
  );
  await page.goto('/sources');
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('link', { name: /^Voir la source/ })).toHaveCount(0);
});
