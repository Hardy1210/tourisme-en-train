// Lit les tokens --map-* : les couleurs calculées (color-mix) passent par un canevas, car MapLibre ne les lit pas.
import type { CouleursCarte } from './style';

const TOKENS: Record<keyof CouleursCarte, string> = {
  land: '--map-land',
  road: '--map-road',
  water: '--map-water',
  green: '--map-green',
  route: '--map-route',
  texte: '--muted-foreground',
  texteFort: '--foreground',
  halo: '--map-halo',
};

export function lireCouleursCarte(): CouleursCarte {
  return lireTokens(TOKENS);
}

/** Valeur `rgb(…)` de chaque token CSS demandé (MapLibre et les images de la carte ne lisent pas `var()`). */
export function lireTokens<Cle extends string>(tokens: Record<Cle, string>): Record<Cle, string> {
  const sonde = document.createElement('span');
  document.body.append(sonde);
  const toile = document.createElement('canvas');
  toile.width = 1;
  toile.height = 1;
  const contexte = toile.getContext('2d', { willReadFrequently: true });
  if (!contexte) throw new Error('Canevas indisponible.');

  const versRgb = (token: string): string => {
    sonde.style.color = `var(${token})`;
    contexte.clearRect(0, 0, 1, 1);
    contexte.fillStyle = getComputedStyle(sonde).color;
    contexte.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = contexte.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  };
  const entrees = Object.entries<string>(tokens).map(([cle, token]) => [cle, versRgb(token)]);
  sonde.remove();
  return Object.fromEntries(entrees) as Record<Cle, string>;
}
