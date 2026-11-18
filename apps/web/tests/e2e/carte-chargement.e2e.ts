// Les lieux de la carte sont demandés sans attendre le fond de carte (D095) : sur téléphone, toutes les
// tuiles arrivaient avant la demande, et les bulles plusieurs secondes après. Échantillon, sans réseau.
import { expect, test } from './test';
import { ADRESSE_FOND_CARTE, couperLeReseau } from './outils';

test.use({ geolocation: { latitude: 47.3233, longitude: 5.0272 }, permissions: ['geolocation'] });

test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

test('fond de carte sans réponse : les lieux sont déjà demandés, avec les gares de destination', async ({
  page,
  context,
}) => {
  // Le style du fond ne répond jamais : la carte ne finit pas de charger.
  if (ADRESSE_FOND_CARTE) await context.route(ADRESSE_FOND_CARTE, () => undefined);
  const demande = page.waitForRequest((r) => r.url().includes('/api/carte/lieux'));
  await page.goto('/?date=2026-11-18');
  const url = new URL((await demande).url());
  expect(url.searchParams.get('gares')).toBeTruthy();
});

test('fond de carte chargé : une seule demande des lieux', async ({ page }) => {
  const demandes: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/carte/lieux')) demandes.push(r.url());
  });
  await page.goto('/?date=2026-11-18');
  await expect.poll(() => demandes.length).toBe(1);
  await page.waitForTimeout(1000);
  expect(demandes).toHaveLength(1);
});

// Next.js 16.4.5 retire l'en-tête `Content-Encoding` des routes (GHSA-pc58-hwjq-p385) : une réponse
// compressée par la route arrivait illisible, sans bulle sur la carte (D098). La compression est celle du
// proxy de production, jamais celle de la route.
test('les lieux de la carte arrivent lisibles par le navigateur', async ({ page }) => {
  await page.goto('/?date=2026-11-18');
  const lecture = await page.evaluate(async () => {
    const reponse = await fetch('/api/carte/lieux?lat=47.3233&lon=5.0272&rayon=2000');
    try {
      const corps = (await reponse.json()) as { lieux?: unknown[] };
      return Array.isArray(corps.lieux) ? `${corps.lieux.length} lieux` : 'sans lieux';
    } catch {
      return 'illisible';
    }
  });
  expect(lecture).toMatch(/^[1-9]\d* lieux$/);
});
