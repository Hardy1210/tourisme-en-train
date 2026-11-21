// Barre du haut des fiches (Hardy, 20/11) : le bouton Retour est au même endroit, avec le même dessin, sur
// toutes les fiches — avec ou sans photo, destination, erreur — et sur les pages de lecture (Sources,
// À propos, Mentions légales, 21/11). Une seule règle (`barre-retour`) : aucun
// écran ne le place lui-même. Données d'exemple (db/echantillon/).
import { expect, test, type Page } from './test';
import { couperLeReseau } from './outils';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

const FICHES = [
  ['destination', '/destinations/EX000002?depuis=EX000001'],
  ['lieu avec photo', '/lieux/echantillon-ECH_L02'],
  ['lieu sans photo', '/lieux/echantillon-ECH_L01'],
  ['lieu introuvable', '/lieux/echantillon-INEXISTANT'],
  ['sources', '/sources'],
  ['à propos', '/a-propos'],
  ['mentions légales', '/mentions-legales'],
] as const;

async function placeDuRetour(page: Page, chemin: string) {
  await page.goto(chemin);
  const retour = page.getByRole('button', { name: 'Retour' });
  await expect(retour).toBeVisible();
  const boite = await retour.boundingBox();
  if (!boite) throw new Error(`Retour sans position : ${chemin}`);
  const fond = await retour.evaluate((b) => getComputedStyle(b).backgroundColor);
  return { x: Math.round(boite.x), y: Math.round(boite.y), taille: Math.round(boite.width), fond };
}

test('le bouton Retour a la même place et le même dessin sur toutes les fiches et les pages', async ({
  page,
}) => {
  const [reference, ...autres] = await Promise.all(
    FICHES.map(async ([, chemin]) => placeDuRetour(await page.context().newPage(), chemin)),
  );
  for (const [i, place] of autres.entries()) {
    expect(place, `${FICHES[i + 1]?.[0]} comparée à ${FICHES[0][0]}`).toEqual(reference);
  }
  // Limite : un bouton rond de 44 px, en haut à gauche, jamais collé au bord.
  expect(reference?.taille).toBe(44);
  expect(reference?.x).toBeGreaterThan(0);
  expect(reference?.y).toBeGreaterThan(0);
});
