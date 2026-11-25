// Feuille de résultats glissée au doigt (④, D120), sur téléphone : de vrais événements tactiles
// (Chromium), sur l'échantillon (données d'exemple, db/echantillon/), réseau coupé, date fixe.
import { expect, test, type Page } from './test';
import { couperLeReseau } from './outils';

const ECRAN = '/?date=2026-11-18';

test.use({ geolocation: { latitude: 47.3233, longitude: 5.0272 }, permissions: ['geolocation'] });

test.beforeEach(async ({ context, baseURL, isMobile }) => {
  test.skip(!isMobile, 'La feuille n’existe que sur mobile.');
  await couperLeReseau(context, baseURL);
  await context.route('**/api/geocodage/inverse*', (requete) =>
    requete.fulfill({ json: { commune: 'Dijon', codeInsee: '21231', horsLigne: false } }),
  );
});

const positionFeuille = (page: Page) => page.locator('[data-feuille]');
const poignee = (page: Page) =>
  page.getByRole('button', { name: 'Déplacer le panneau des résultats' });

/** Un doigt posé sur la feuille, 80 px sous la poignée, qui glisse de `dy` en `etapes` mouvements. */
async function glisser(page: Page, dy: number, { etapes = 8, pauseFinMs = 0 } = {}) {
  const cadre = await poignee(page).boundingBox();
  if (!cadre) throw new Error('Poignée introuvable');
  const x = cadre.x + cadre.width / 2;
  const y = cadre.y + cadre.height + 80;
  const session = await page.context().newCDPSession(page);
  const toucher = (type: 'touchStart' | 'touchMove' | 'touchEnd', yDoigt?: number) =>
    session.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: yDoigt === undefined ? [] : [{ x, y: yDoigt }],
    });
  await toucher('touchStart', y);
  for (let etape = 1; etape <= etapes; etape += 1) {
    await toucher('touchMove', y + (dy * etape) / etapes);
    await page.waitForTimeout(16);
  }
  if (pauseFinMs > 0) await page.waitForTimeout(pauseFinMs);
  await toucher('touchEnd');
  await session.detach();
}

async function ouvrir(page: Page) {
  await page.goto(ECRAN);
  await expect(page.getByRole('link', { name: 'Voir la sortie' }).first()).toBeAttached();
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'milieu');
}

test('à moitié, glisser vers le haut n’importe où sur la feuille la monte, sans rien ouvrir', async ({
  page,
}) => {
  await ouvrir(page);
  const adresse = page.url();
  await glisser(page, -250);
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'plein');
  expect(page.url()).toBe(adresse);
});

test('un doigt qui bouge à peine ne déplace pas la feuille', async ({ page }) => {
  await ouvrir(page);
  await glisser(page, -4, { etapes: 2 });
  await page.waitForTimeout(400);
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'milieu');
});

test('lâchée doucement près de sa position, elle y revient ; lancée vers le bas, elle descend', async ({
  page,
}) => {
  await ouvrir(page);
  await glisser(page, 60, { pauseFinMs: 200 });
  await page.waitForTimeout(400);
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'milieu');

  await glisser(page, 150);
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'carte');
});

test('tout en haut, liste à son début : vers le bas redescend la feuille, vers le haut non', async ({
  page,
}) => {
  await ouvrir(page);
  await poignee(page).click();
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'plein');

  await glisser(page, -150);
  await page.waitForTimeout(400);
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'plein');

  await poignee(page)
    .locator('xpath=following-sibling::div[1]')
    .evaluate((liste) => {
      liste.scrollTop = 0;
    });
  await glisser(page, 250);
  await expect(positionFeuille(page)).not.toHaveAttribute('data-feuille', 'plein');
});

test('atteint au clavier sous le bas de l’écran, un élément fait monter la feuille ; visible, non', async ({
  page,
}) => {
  await ouvrir(page);
  await poignee(page).focus();
  await page.waitForTimeout(400);
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'milieu');

  await page.getByRole('link', { name: 'Voir la sortie' }).last().focus();
  await expect(positionFeuille(page)).toHaveAttribute('data-feuille', 'plein');
});
