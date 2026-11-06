// Page « L'âme du produit » : atteinte depuis le menu, chiffres sourcés, sortie vers l'application.
import { expect, test } from '@playwright/test';
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

test('un chiffre affiché a sa source, un chiffre non confirmé n’apparaît pas', async ({ page }) => {
  await page.goto('/a-propos');
  await expect(page.getByText('14 kg contre 2,8 kg')).toBeVisible();
  await expect(page.getByRole('link', { name: /Impact CO2 \(TER\)/ })).toHaveAttribute(
    'href',
    'https://impactco2.fr/outils/transport/ter',
  );
  await expect(page.getByText('97 Mt')).toHaveCount(0);
  await expect(page.getByText('69 %')).toHaveCount(0);
});

test('« Ouvrir l’application » mène à Explorer', async ({ page }) => {
  await page.goto('/a-propos');
  await page.getByRole('link', { name: "Ouvrir l'application" }).click();
  await expect(page).toHaveURL(/\/(\?.*)?$/);
});
