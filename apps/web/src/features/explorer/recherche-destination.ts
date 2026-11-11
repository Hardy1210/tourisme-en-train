// Recherche d'une destination dans la liste déjà chargée, sans appel à l'API (D084). Fonctions pures.
import type { Destination } from '@/features/destinations/schemas';

import { TEXTES_TRAJET } from './contenu-trajet';

/** Ce que la personne cherche : un texte tapé, ou une destination touchée dans la liste. */
export type Recherche = {
  /** Texte tapé ; pour une destination touchée, son nom (affiché dans la barre). */
  recherche: string;
  /** Code UIC de la gare en tête de la destination touchée (D052) ; null pour un texte tapé. */
  destination: string | null;
};

/** « Bligny-lès-BEAUNE » → « bligny les beaune » : sans accents, sans majuscules, mots séparés. */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Tous les noms sous lesquels on peut chercher une destination : ville, commune, toutes ses gares. */
function nomsDe(destination: Destination): string[] {
  return [
    destination.titre,
    destination.commune.nom ?? '',
    destination.gare.nom,
    ...destination.autresGares.map((gare) => gare.nom),
  ].map(normaliser);
}

/** Chaque mot cherché est le début d'un mot d'un même nom. */
function correspond(noms: readonly string[], mots: readonly string[]): boolean {
  return noms.some((nom) => {
    const motsDuNom = nom.split(' ');
    return mots.every((mot) => motsDuNom.some((m) => m.startsWith(mot)));
  });
}

/**
 * Destination touchée : elle seule. Texte tapé : les destinations dont un nom commence par chacun des
 * mots, dans l'ordre de la liste (temps de trajet). Rien de cherché : toute la liste, inchangée.
 */
export function filtrerDestinations<T extends Destination>(
  liste: readonly T[],
  { recherche, destination }: Recherche,
): readonly T[] {
  if (destination !== null) return liste.filter((d) => d.gare.uic === destination);
  const cherche = normaliser(recherche);
  if (cherche === '') return liste;
  const mots = cherche.split(' ');
  return liste.filter((d) => correspond(nomsDe(d), mots));
}

/** Partie destination de la barre du trajet : « Où aller ? », « Beaune » ou « « beau » · 2 ». */
export function libelleDestination(
  { recherche, destination }: Recherche,
  nombre: number,
): { texte: string; active: boolean } {
  const propre = recherche.trim();
  if (destination !== null && propre !== '') return { texte: propre, active: true };
  if (propre === '') return { texte: TEXTES_TRAJET.ouAller, active: false };
  return { texte: `« ${propre} » · ${nombre}`, active: true };
}
