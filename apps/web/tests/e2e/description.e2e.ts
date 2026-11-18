// Description d'un lieu (D105), sur l'échantillon (données d'exemple, db/echantillon/) : paragraphes gardés,
// 4 lignes puis « Lire la suite », « Source : … » juste dessous, jamais deux fois l'attribution.
import { expect, test } from './test';
import { couperLeReseau } from './outils';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

test('une longue description garde ses paragraphes ; « Lire la suite » la déplie ; la source suit', async ({
  page,
}) => {
  await page.goto('/lieux/echantillon-ECH_L14');
  const texte = page.getByText(/Donnée d'exemple : premier paragraphe/);
  await expect(texte).toBeVisible();
  const lireLaSuite = page.getByRole('button', { name: 'Lire la suite' });
  await expect(lireLaSuite).toHaveAttribute('aria-expanded', 'false');
  const replie = (await texte.boundingBox())?.height ?? 0;

  await lireLaSuite.click();
  await expect(page.getByRole('button', { name: 'Réduire' })).toHaveAttribute('aria-expanded', 'true');
  expect((await texte.boundingBox())?.height ?? 0).toBeGreaterThan(replie);
  expect(await texte.innerText()).toMatch(/\n\s*\nDonnée d'exemple : second paragraphe/);

  await expect(page.getByText("Source : Données d'exemple")).toBeVisible();
  await expect(page.getByText(/Données d'exemple/)).toHaveCount(1);
});

test('limite : un lieu sans description garde son attribution, une seule fois, sans « Source : »', async ({
  page,
}) => {
  await page.goto('/lieux/echantillon-ECH_L50');
  await expect(page.getByRole('heading', { level: 1, name: 'Exemple - Musée du village' })).toBeVisible();
  await expect(page.getByText(/Données d'exemple/)).toHaveCount(1);
  await expect(page.getByText(/^Source : /)).toHaveCount(0);
});
