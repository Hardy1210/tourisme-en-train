// La carte doit réellement se dessiner : les épingles sont du HTML, elles restent visibles sur une
// carte vide. Avec MapLibre 6, le fond disparaît alors que tous les autres parcours passent (D062).
// Sans réseau : le fond simulé (données d'exemple) passe par le module de travail de MapLibre, comme
// les vraies tuiles. Couche nommée `water` pour recevoir la couleur du token --map-water.
import { expect, test, type Page } from '@playwright/test';
import { couperLeReseau } from './outils';

const STYLE_FOND_SIMULE = {
  version: 8,
  sources: {
    fond: {
      type: 'geojson',
      data: {
        type: 'Polygon',
        coordinates: [
          [
            [-10, 35],
            [20, 35],
            [20, 60],
            [-10, 60],
            [-10, 35],
          ],
        ],
      },
    },
  },
  layers: [{ id: 'water', type: 'fill', source: 'fond' }],
};
const PART_MINIMALE_DU_FOND = 0.1;

/** Part des pixels de la carte qui ont la couleur du fond simulé, d'après une capture d'écran. */
async function partDuFondDessine(page: Page): Promise<number> {
  const capture = await page
    .getByRole('region', { name: 'Carte des lieux et des destinations' })
    .screenshot();
  return page.evaluate(async (base64) => {
    const toile = document.createElement('canvas');
    const contexte = toile.getContext('2d', { willReadFrequently: true });
    if (!contexte) throw new Error('Canevas indisponible.');
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    toile.width = image.width;
    toile.height = image.height;

    const sonde = document.createElement('span');
    sonde.style.color = 'var(--map-water)';
    document.body.append(sonde);
    contexte.fillStyle = getComputedStyle(sonde).color;
    sonde.remove();
    contexte.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = contexte.getImageData(0, 0, 1, 1).data;

    contexte.drawImage(image, 0, 0);
    const pixels = contexte.getImageData(0, 0, toile.width, toile.height).data;
    let identiques = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const ecart =
        Math.abs((pixels[i] ?? 0) - r) +
        Math.abs((pixels[i + 1] ?? 0) - g) +
        Math.abs((pixels[i + 2] ?? 0) - b);
      if (ecart <= 12) identiques += 1;
    }
    return identiques / (pixels.length / 4);
  }, capture.toString('base64'));
}

test.use({
  geolocation: { latitude: 47.3233, longitude: 5.0272 },
  permissions: ['geolocation'],
});

test('la carte dessine son fond, sans erreur du module de travail', async ({
  page,
  context,
  baseURL,
}) => {
  await couperLeReseau(context, baseURL, STYLE_FOND_SIMULE);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
  const erreursModule: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /worker/i.test(message.text())) {
      erreursModule.push(message.text());
    }
  });
  page.on('pageerror', (erreur) => {
    if (/worker/i.test(erreur.message)) erreursModule.push(erreur.message);
  });

  await page.goto('/?date=2026-11-18');
  // Délai large : c'est souvent le premier parcours, sur un serveur qui vient de démarrer.
  await expect(page.getByRole('button', { name: /en train direct$/ }).first()).toBeAttached({
    timeout: 20_000,
  });

  await expect
    .poll(() => partDuFondDessine(page), { timeout: 15_000 })
    .toBeGreaterThan(PART_MINIMALE_DU_FOND);
  expect(erreursModule).toEqual([]);
});
