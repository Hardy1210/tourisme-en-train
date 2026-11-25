import 'server-only';
import { type Categorie } from '@tourisme/commun';
import { sql, type SQL } from 'drizzle-orm';

import { parametres } from '@/config/parametres';
import { filtreCategories } from '@/lib/db/filtre-categories';

// Lieux masqués (piscines…) : jamais dans `lieu_gare` (D093), rien à filtrer ici.
const { sousCategoriesNomPropreRequis } = parametres.lieux.ongletLieux;

const liste = (valeurs: readonly string[]) =>
  sql.join(
    valeurs.map((v) => sql`${v}`),
    sql`, `,
  );

/** Filtres de l'onglet Lieux en rangées (D121). */
export type FiltresAccessibles = {
  gareId: number;
  codeInsee: string | null;
  date: string;
  dureeMax: number;
  categories: readonly Categorie[] | null;
};

/**
 * Lieux à pied des gares atteintes en train direct depuis `gareId` ce jour-là, filtres et exclusions de
 * l'onglet Lieux compris (D056, D057) : les rangées (D121) partent de ces lignes. Les lieux de la ville de départ sont écartés : à pied de la gare de départ, ou à côté
 * d'une gare de sa commune. Aires de jeux sans nom propre réservées à « Près de vous » et à la fiche.
 * Alias : `ld` (liaison), `g` (gare d'arrivée), `lg` (lieu_gare), `l` (lieu).
 */
export function lieuxDesGaresAtteintes(filtres: FiltresAccessibles): SQL {
  return sql`FROM liaison_directe ld
      JOIN gare g ON g.id = ld.gare_arrivee_id
      JOIN lieu_gare lg ON lg.gare_id = g.id
      JOIN lieu l ON l.id = lg.lieu_id
      WHERE ld.gare_depart_id = ${filtres.gareId} AND ld.date_service = ${filtres.date}
        AND ld.duree_min <= ${filtres.dureeMax}
        AND g.code_insee IS DISTINCT FROM ${filtres.codeInsee}
        AND l.doublon_de IS NULL AND l.site_de IS NULL
        AND ${filtreCategories(filtres.categories)}
        AND NOT (coalesce(l.sous_categorie, '') IN (${liste(sousCategoriesNomPropreRequis)})
                 AND lower(unaccent(l.nom)) = lower(unaccent(l.sous_categorie)))
        AND NOT EXISTS (SELECT 1 FROM lieu_gare depart
                        WHERE depart.lieu_id = lg.lieu_id AND depart.gare_id = ${filtres.gareId})`;
}
