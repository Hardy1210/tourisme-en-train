// Contraste AA (WCAG 2.2, 1.4.3) mesuré dans le navigateur, sur les couleurs réellement calculées :
// chaque texte visible contre le fond qui l'entoure (fonds semi-transparents composés). Fiche destination,
// sur le fond de la marque (maquette du 18/11), en clair et en sombre, dans ses trois onglets.
// Données d'exemple (db/echantillon/).
import { expect, test, type Page } from './test';
import { couperLeReseau } from './outils';

const BEAUNE = '/destinations/EX000002?depuis=EX000001&date=2026-11-18';

test.beforeEach(async ({ context, baseURL }) => {
  await couperLeReseau(context, baseURL);
});

/** Textes sous le seuil AA : 4,5:1, ou 3:1 pour un grand texte (24 px, ou 18,66 px en gras). */
async function textesPeuContrastes(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const toile = document.createElement('canvas');
    toile.width = toile.height = 1;
    const ctx = toile.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('canvas indisponible');
    /** Toute couleur CSS (oklch, color-mix…) ramenée en sRGB par le navigateur lui-même. */
    const rgba = (couleur: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = couleur;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const poser = (
      dessus: [number, number, number, number],
      dessous: [number, number, number],
    ): [number, number, number] => {
      const a = dessus[3];
      return [0, 1, 2].map((i) => (dessus[i] ?? 0) * a + (dessous[i] ?? 0) * (1 - a)) as [
        number,
        number,
        number,
      ];
    };
    const fondDe = (element: Element): [number, number, number] => {
      const couches: [number, number, number, number][] = [];
      for (let e: Element | null = element; e; e = e.parentElement) {
        const c = rgba(getComputedStyle(e).backgroundColor);
        if (c[3] > 0) couches.push(c);
        if (c[3] >= 1) break;
      }
      let fond: [number, number, number] = [255, 255, 255];
      for (const couche of couches.reverse()) fond = poser(couche, fond);
      return fond;
    };
    const luminance = ([r, g, b]: [number, number, number]) => {
      const canal = (v: number) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
    };
    const ecarts: string[] = [];
    for (const element of document.querySelectorAll('main *')) {
      const texte = [...element.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim() ?? '')
        .join(' ')
        .trim();
      if (!texte || !(element instanceof HTMLElement) || element.getClientRects().length === 0) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden') continue;
      const fond = fondDe(element);
      const couleur = poser(rgba(style.color), fond);
      const [clair, sombre] = [luminance(couleur), luminance(fond)].sort((a, b) => b - a);
      const ratio = ((clair ?? 0) + 0.05) / ((sombre ?? 0) + 0.05);
      const taille = parseFloat(style.fontSize);
      const grand = taille >= 24 || (taille >= 18.66 && Number(style.fontWeight) >= 700);
      if (ratio < (grand ? 3 : 4.5)) ecarts.push(`${ratio.toFixed(2)} « ${texte.slice(0, 40)} »`);
    }
    return ecarts;
  });
}

for (const theme of ['clair', 'sombre'] as const) {
  test(`fiche destination (${theme}) : tous les textes au contraste AA, dans les trois onglets`, async ({
    page,
  }) => {
    await page.goto(BEAUNE);
    await page.evaluate((sombre) => document.documentElement.classList.toggle('dark', sombre), theme === 'sombre');
    await expect(page.getByRole('heading', { name: 'Beaune', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Exemple - / }).first()).toBeVisible();
    expect(await textesPeuContrastes(page), 'onglet Lieux').toEqual([]);

    await page.getByRole('tab', { name: 'Trains' }).click();
    await expect(page.getByRole('region', { name: 'Aller' })).toBeVisible();
    expect(await textesPeuContrastes(page), 'onglet Trains').toEqual([]);

    await page.getByRole('tab', { name: 'Sur place' }).click();
    await expect(page.getByText('Aucun transport repéré autour de cette gare')).toBeVisible();
    expect(await textesPeuContrastes(page), 'onglet Sur place').toEqual([]);
  });
}
