// Pages de lecture : rien ne dépasse la largeur de l'écran (Hardy, 21/11 : sur Sources, deux licences
// trop longues, sans retour à la ligne, rendaient la page deux fois plus large que l'iPhone, qui défilait
// dans tous les sens). Mesuré à 390 px (iPhone) et 320 px (plus petit écran courant).
import { expect, test, type Page } from './test';
import { sources } from '@tourisme/commun';
import { couperLeReseau } from './outils';

const PAGES = ['/sources', '/a-propos', '/mentions-legales'] as const;
const LARGEURS = [390, 320] as const;

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

/** Ce qui défile en largeur sur la page : le document et chaque zone qui défile. */
async function debordements(page: Page) {
  return page.evaluate(() =>
    [document.documentElement, ...document.querySelectorAll('body *')]
      .filter((e) => {
        const style = getComputedStyle(e);
        const defile =
          e === document.documentElement || ['auto', 'scroll'].includes(style.overflowX);
        return defile && e.scrollWidth > e.clientWidth + 1;
      })
      .map((e) => `${e.tagName} : ${e.scrollWidth} px pour ${e.clientWidth} px visibles`),
  );
}

for (const largeur of LARGEURS) {
  for (const chemin of PAGES) {
    test(`${chemin} à ${largeur} px ne défile pas en largeur`, async ({ page }) => {
      await page.setViewportSize({ width: largeur, height: 844 });
      await page.goto(chemin);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (chemin === '/sources') await expect(page.getByRole('article').first()).toBeVisible();
      expect(await debordements(page)).toEqual([]);
    });
  }
}

type Source = (typeof sources.sources)[number];
const AFFICHEES = sources.sources.filter((s) => s.affichee);
const LA_PLUS_LONGUE = AFFICHEES.reduce((a, b) => (b.licence.length > a.licence.length ? b : a));
const LA_PLUS_COURTE = AFFICHEES.reduce((a, b) => (b.licence.length < a.licence.length ? b : a));

/** La carte d'une source (trouvée par son titre) et la pastille de sa licence. */
async function pastille(page: Page, source: Source) {
  const carte = page.getByRole('article').filter({
    has: page.getByRole('heading', { level: 3, name: source.nom, exact: true }),
  });
  const boiteCarte = await carte.boundingBox();
  const boite = await carte.getByText(source.licence, { exact: true }).boundingBox();
  if (!boiteCarte || !boite) throw new Error(`Licence introuvable : ${source.nom}`);
  return { carte: boiteCarte, boite };
}

test('la licence la plus longue passe à la ligne et reste dans sa carte', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/sources');
  const { carte, boite } = await pastille(page, LA_PLUS_LONGUE);
  expect(boite.x + boite.width).toBeLessThanOrEqual(carte.x + carte.width);
  const { boite: courte } = await pastille(page, LA_PLUS_COURTE);
  expect(boite.height).toBeGreaterThan(courte.height);
});

test('limite : une licence courte reste sur une seule ligne', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/sources');
  const { carte, boite } = await pastille(page, LA_PLUS_COURTE);
  expect(boite.x + boite.width).toBeLessThanOrEqual(carte.x + carte.width);
  // Une ligne : la hauteur de la pastille ne dépasse pas sa hauteur minimale (min-h-5.5 = 22 px).
  expect(boite.height).toBeLessThanOrEqual(22);
});
