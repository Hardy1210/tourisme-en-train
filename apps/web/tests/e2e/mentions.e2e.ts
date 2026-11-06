// Mentions légales et confidentialité : atteintes depuis le menu, position expliquée, aucun cookie.
import { expect, test } from '@playwright/test';
import { couperLeReseau } from './outils';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

test('le menu mène à la page, qui explique la position', async ({ page }) => {
  await page.goto('/mon-espace');
  await page.getByRole('button', { name: 'Infos' }).click();
  await page.getByRole('link', { name: /Mentions légales/ }).click();
  await expect(page).toHaveURL(/\/mentions-legales$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mentions légales');
  await expect(page.getByText('wagoo.train@gmail.com')).toBeVisible();
  await expect(page.getByText('jamais enregistrée')).toBeVisible();
  await expect(page.getByText(/API Adresse de l'IGN/)).toBeVisible();
  await expect(page.getByText(/OpenFreeMap/)).toBeVisible();
});

test('l’application ne pose aucun cookie, ce que la page annonce', async ({ page, context }) => {
  await page.goto('/mentions-legales');
  await expect(page.getByText('Aucun cookie')).toBeVisible();
  expect(await context.cookies()).toEqual([]);
});
