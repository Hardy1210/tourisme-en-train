// Horaires d'ouverture lisibles (D108), sur l'échantillon (données d'exemple, db/echantillon/) :
// lignes françaises, résumé « Aujourd'hui, … » de la saison du jour (instant des tests : 19/11/2026, hiver) ;
// texte d'origine quand il n'est pas compris.
import { expect, test } from './test';
import { couperLeReseau } from './outils';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

test('les horaires sont en lignes françaises, avec le résumé du jour en haut', async ({ page }) => {
  await page.goto('/lieux/echantillon-ECH_L14');
  const horaires = page.getByRole('region', { name: 'Horaires' });
  await expect(horaires.getByText('1er avr. – 15 nov.')).toBeVisible();
  await expect(horaires.getByText('14 h – 18 h 30').first()).toBeVisible();
  await expect(horaires.getByText(/Apr 01/)).toHaveCount(0);

  // Instant des tests : jeudi 19/11/2026, saison d'hiver.
  await expect(horaires.getByText(/Aujourd’hui/)).toHaveCount(1);
  await expect(horaires.getByText(/Aujourd’hui/)).toHaveText('Aujourd’hui, jeu. 19 nov. :');
  await expect(horaires.getByText('9 h – 12 h · 14 h – 18 h 30')).toBeVisible();
});

test('limite : des horaires non compris restent tels quels, sans « Aujourd’hui »', async ({
  page,
}) => {
  await page.goto('/lieux/echantillon-ECH_L50');
  const horaires = page.getByRole('region', { name: 'Horaires' });
  await expect(horaires.getByText('May-Oct Su[1]')).toBeVisible();
  await expect(horaires.getByText('Aujourd’hui')).toHaveCount(0);
});
