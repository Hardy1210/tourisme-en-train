'use client';
// Icônes de catégorie dessinées dans la carte (D091) : même dessin que les épingles HTML (cercle clair,
// icône Lucide aux couleurs de la catégorie), converti en image pour MapLibre, qui ne sait pas afficher
// des milliers d'éléments HTML.
import { CATEGORIES, type Categorie } from '@tourisme/commun';
import type { Map as CarteMapLibre } from 'maplibre-gl';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { APPARENCE_CATEGORIE } from '@/features/lieux/ui/icone-categorie';
import { lireTokens } from './couleurs';

/** Nom de l'image d'une catégorie dans la carte : préfixe + catégorie. */
export const PREFIXE_IMAGE = 'lieu-';
export const imageCategorie = (categorie: Categorie): string => `${PREFIXE_IMAGE}${categorie}`;

// Taille en pixels réels ; `pixelRatio: 2` l'affiche à 28 px, comme l'épingle HTML (size-7).
const TAILLE = 56;
const ICONE = 32;

function svgEpingle(categorie: Categorie, fond: string, bord: string, trait: string): string {
  const icone = renderToStaticMarkup(
    createElement(APPARENCE_CATEGORIE[categorie].Icone, {
      size: ICONE,
      color: trait,
      x: (TAILLE - ICONE) / 2,
      y: (TAILLE - ICONE) / 2,
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TAILLE}" height="${TAILLE}">
<circle cx="${TAILLE / 2}" cy="${TAILLE / 2}" r="${TAILLE / 2 - 2}" fill="${fond}" stroke="${bord}" stroke-width="2"/>
${icone}</svg>`;
}

function charger(svg: string): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const image = new Image(TAILLE, TAILLE);
    image.onload = () => resoudre(image);
    image.onerror = rejeter;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** Ajoute les cinq images à la carte ; couleurs lues dans les tokens de `globals.css`. */
export async function enregistrerIconesCategories(carte: CarteMapLibre): Promise<void> {
  const tokens = lireTokens({
    fond: '--surface',
    bord: '--border',
    enfants: '--cat-enfants-foreground',
    nature: '--cat-nature-foreground',
    parcs: '--cat-parcs-foreground',
    patrimoine: '--cat-patrimoine-foreground',
    culture: '--cat-culture-foreground',
  });
  await Promise.all(
    CATEGORIES.map(async (categorie) => {
      if (carte.hasImage(imageCategorie(categorie))) return;
      const image = await charger(
        svgEpingle(categorie, tokens.fond, tokens.bord, tokens[categorie]),
      );
      if (!carte.hasImage(imageCategorie(categorie))) {
        carte.addImage(imageCategorie(categorie), image, { pixelRatio: 2 });
      }
    }),
  );
}
