// Chargement des communes (docs/04-traitement-donnees.md § 4.0, D038) : table temporaire
// `tmp_commune`, contrôles bloquants, puis mise à jour de `commune` PAR `code_insee` (jamais
// supprimer puis réinsérer : `gare.code_insee` pointe vers `commune`).
import type pg from 'pg';
import { parametres } from '../config';
import { aucune, auMoins, type Controle } from '../controles/base';

export const TABLE_TEMPORAIRE = {
  nom: 'tmp_commune',
  colonnes: [
    ['code_insee', 'char(5)'],
    ['nom', 'text'],
    ['departement', 'char(3)'],
  ],
} as const;

export const CONTROLES: readonly Controle[] = [
  auMoins(
    'Communes en France',
    'SELECT count(*)::int AS n FROM tmp_commune',
    parametres.controles.communesFranceMin,
  ),
  // Une région sans commune ferait tomber toutes ses gares hors région au prochain chargement.
  aucune(
    'Département de la région sans commune',
    `SELECT count(*)::int AS n FROM unnest($1::text[]) d
     WHERE NOT EXISTS (SELECT 1 FROM tmp_commune c WHERE c.departement = d)`,
    [parametres.region.departements],
  ),
];

const INSERER_OU_METTRE_A_JOUR = `
  INSERT INTO commune (code_insee, nom, departement)
  SELECT code_insee, nom, departement FROM tmp_commune
  ON CONFLICT (code_insee) DO UPDATE SET nom = EXCLUDED.nom, departement = EXCLUDED.departement`;

// Une table qui pointe vers `commune` et manque ici fait échouer le DELETE (clé étrangère) :
// le chargement est annulé, jamais une commune référencée supprimée en silence.
const REFERENCEE = 'EXISTS (SELECT 1 FROM gare r WHERE r.code_insee = c.code_insee)';

const ABSENTE = 'NOT EXISTS (SELECT 1 FROM tmp_commune t WHERE t.code_insee = c.code_insee)';

export interface BilanFusion {
  chargees: number;
  supprimees: number;
  /** Codes absents du fichier mais gardés, car référencés. */
  gardees: string[];
}

export async function fusionnerCommunes(client: pg.ClientBase): Promise<BilanFusion> {
  const { rowCount } = await client.query(INSERER_OU_METTRE_A_JOUR);
  const supprimees = await client.query(
    `DELETE FROM commune c WHERE ${ABSENTE} AND NOT ${REFERENCEE}`,
  );
  const gardees = await client.query<{ nom: string; code_insee: string }>(
    `SELECT nom, code_insee FROM commune c WHERE ${ABSENTE} ORDER BY code_insee`,
  );
  return {
    chargees: rowCount ?? 0,
    supprimees: supprimees.rowCount ?? 0,
    gardees: gardees.rows.map((c) => `${c.nom} (${c.code_insee})`),
  };
}
