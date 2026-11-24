'use client';
// Épingles des lieux dessinées dans la carte d'Explorer (D091, D119) : la goutte de `formeEpingle`, l'icône
// Lucide de la catégorie au centre du cercle, convertie en image pour MapLibre, qui ne sait pas afficher
// des milliers d'éléments HTML. Deux images par catégorie : normale, et « touchée » (plus grande, pleine).
// Les icônes viennent de `IconesCachees`, rendues par React dans la page : sans `react-dom/server`, qui
// alourdissait la carte de 209 Ko (parcours trop lents sur téléphone).
import { CATEGORIES, type Categorie } from '@tourisme/commun';
import type { Map as CarteMapLibre } from 'maplibre-gl';
import { lireTokens } from './couleurs';
import { formeEpingle } from './epingle';

/** Nom de l'image d'une catégorie dans la carte : préfixe + catégorie. */
export const PREFIXE_IMAGE = 'lieu-';
/** Le lieu touché : même catégorie, plus grande et pleine. */
export const PREFIXE_IMAGE_TOUCHEE = 'lieu-touche-';
export const imageCategorie = (categorie: Categorie, touchee = false): string =>
  `${touchee ? PREFIXE_IMAGE_TOUCHEE : PREFIXE_IMAGE}${categorie}`;

// Pixels réels ; `pixelRatio: 2` affiche l'épingle à 30 px (touchée : 40 px), comme la maquette.
const RAYON = { normale: 30, touchee: 40 } as const;
const ICONE = { normale: 30, touchee: 38 } as const;

/** Attribut que porte chaque icône cachée, pour la retrouver. */
export const ATTRIBUT_ICONE = 'data-icone-categorie';
export const TAILLE_ICONE = ICONE.normale;

type Couleurs = { fond: string; bord: string; trait: string };

function svgEpingle(icone: Element, taille: keyof typeof RAYON, { fond, bord, trait }: Couleurs) {
  const forme = formeEpingle(RAYON[taille]);
  const copie = icone.cloneNode(true) as Element;
  copie.setAttribute('width', String(ICONE[taille]));
  copie.setAttribute('height', String(ICONE[taille]));
  copie.setAttribute('x', String(forme.cx - ICONE[taille] / 2));
  copie.setAttribute('y', String(forme.cy - ICONE[taille] / 2));
  copie.setAttribute('stroke', trait);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${forme.largeur}" height="${forme.hauteur}">
<path d="${forme.chemin}" fill="${fond}" stroke="${bord}" stroke-width="2"/>
${copie.outerHTML}</svg>`;
  return { svg, largeur: forme.largeur, hauteur: forme.hauteur };
}

function charger({ svg, largeur, hauteur }: ReturnType<typeof svgEpingle>) {
  return new Promise<HTMLImageElement>((resoudre, rejeter) => {
    const image = new Image(largeur, hauteur);
    image.onload = () => resoudre(image);
    image.onerror = rejeter;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Ajoute les dix images à la carte ; couleurs lues dans les tokens de `globals.css`. */
export async function enregistrerIconesCategories(
  carte: CarteMapLibre,
  icones: HTMLElement,
): Promise<void> {
  const tokens = lireTokens({
    fond: '--epingle-bg',
    bord: '--epingle-trait',
    fondTouche: '--epingle-touchee-bg',
    texteTouche: '--epingle-touchee-texte',
    enfants: '--cat-enfants-foreground',
    nature: '--cat-nature-foreground',
    parcs: '--cat-parcs-foreground',
    patrimoine: '--cat-patrimoine-foreground',
    culture: '--cat-culture-foreground',
  });
  const ajouter = async (categorie: Categorie, icone: Element, touchee: boolean) => {
    const nom = imageCategorie(categorie, touchee);
    if (carte.hasImage(nom)) return;
    const image = await charger(
      touchee
        ? svgEpingle(icone, 'touchee', {
            fond: tokens.fondTouche,
            bord: tokens.fondTouche,
            trait: tokens.texteTouche,
          })
        : svgEpingle(icone, 'normale', {
            fond: tokens.fond,
            bord: tokens.bord,
            trait: tokens[categorie],
          }),
    );
    if (!carte.hasImage(nom)) carte.addImage(nom, image, { pixelRatio: 2 });
  };
  await Promise.all(
    CATEGORIES.flatMap((categorie) => {
      const icone = icones.querySelector(`[${ATTRIBUT_ICONE}="${categorie}"]`);
      return icone ? [ajouter(categorie, icone, false), ajouter(categorie, icone, true)] : [];
    }),
  );
}
