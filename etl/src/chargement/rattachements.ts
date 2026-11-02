// Rattachements (docs/04-traitement-donnees.md § 4.6, D043, D044) dans UNE transaction :
// décisions manuelles → sections de transformations/rattachements.sql → contrôles → constats et rapports.
// Un contrôle bloquant en échec annule tout : doublons, sites, lieu_gare et gare_stats restent intacts.
import type pg from 'pg';
import { parametres } from '../config';
import {
  aucune,
  type Controle,
  ErreurControles,
  echecsBloquants,
  executerControles,
  type ResultatControle,
} from '../controles/base';
import { enTransaction } from '../db';
import { lireSections, preparer } from '../transformations/sql';
import { poserDecisions, type DecisionsLues } from './decisions-doublons';
import { constatsRattachements, pairesRapport, type PaireRapport } from './rattachements-rapports';

const SECTIONS = [
  'reinitialiser',
  'noms',
  'index_noms',
  'paires',
  'decisions',
  'retirer_paires_decidees',
  'ajouter_paires_decidees',
  'choix',
  'doublons',
  // Une passe remonte d'un cran : trois passes couvrent trois sources plus une décision manuelle.
  'doublons_en_chaine',
  'doublons_en_chaine',
  'doublons_en_chaine',
  'completer',
  'groupes',
  'sites',
  'sites_parc_chateau',
  'vider_lieu_gare',
  'lieu_gare',
  'vider_gare_stats',
  'gare_stats',
] as const;

/** Valeurs des paramètres `:nom` de rattachements.sql, tirées de parametres.json. */
export function valeursRattachements(p = parametres): Record<string, unknown> {
  return {
    distance_m: p.dedoublonnage.distanceM,
    similarite: p.dedoublonnage.similariteNom,
    distance_large_m: p.dedoublonnage.distanceLargeM,
    similarite_large: p.dedoublonnage.similariteNomLarge,
    similarite_relire: p.dedoublonnage.similariteARelire,
    priorites: p.dedoublonnage.prioriteSources,
    sites: JSON.stringify(
      p.regroupementSites.map((r) => ({
        sous_categorie: r.sousCategorie,
        distance_m: r.distanceM,
      })),
    ),
    parc_chateau_m: p.regroupementParcChateau.distanceM,
    rayon_m: p.rayons.lieuxGareM,
    coef_detour: p.marche.coefDetour,
    vitesse_kmh: p.marche.vitesseKmH,
  };
}

export function controlesRattachements(rejetsDecisions = 0): Controle[] {
  const { rayons } = parametres;
  return [
    {
      nom: 'Lignes illisibles dans regles/doublons_manuels.csv',
      bloquant: true,
      verifier: async () => ({
        reussi: rejetsDecisions === 0,
        detail: String(rejetsDecisions),
      }),
    },
    aucune(
      'Décisions manuelles dont un lieu n’existe plus (ligne à retirer)',
      `SELECT count(*)::int AS n FROM tmp_decision t WHERE
         NOT EXISTS (SELECT 1 FROM lieu l WHERE l.source = t.source_garde AND l.id_source = t.id_garde)
         OR NOT EXISTS (SELECT 1 FROM lieu l WHERE l.source = t.source_doublon AND l.id_source = t.id_doublon)`,
      [],
      false,
    ),
    aucune(
      'Lieux doublons d’eux-mêmes (décisions manuelles en boucle)',
      'SELECT count(*)::int AS n FROM lieu WHERE doublon_de = id',
    ),
    aucune(
      'Sources de lieux absentes de dedoublonnage.prioriteSources (jamais dédoublonnées)',
      'SELECT count(DISTINCT source)::int AS n FROM tmp_nom WHERE rang IS NULL',
    ),
    aucune(
      'Sous-catégories de regroupementSites sans aucun lieu (faute de frappe ?)',
      `SELECT count(*)::int AS n FROM jsonb_to_recordset($1::jsonb) AS r(sous_categorie text)
       WHERE NOT EXISTS (SELECT 1 FROM lieu l WHERE l.sous_categorie = r.sous_categorie)`,
      [valeursRattachements().sites],
      false,
    ),
    aucune(
      'Doublons d’un doublon',
      `SELECT count(*)::int AS n FROM lieu l JOIN lieu c ON c.id = l.doublon_de
       WHERE c.doublon_de IS NOT NULL`,
    ),
    aucune(
      'Lieux à la fois doublon et membre d’un site',
      'SELECT count(*)::int AS n FROM lieu WHERE doublon_de IS NOT NULL AND site_de IS NOT NULL',
    ),
    aucune(
      'Doublons ou membres de site dans lieu_gare',
      `SELECT count(*)::int AS n FROM lieu_gare lg JOIN lieu l ON l.id = lg.lieu_id
       WHERE l.doublon_de IS NOT NULL OR l.site_de IS NOT NULL`,
    ),
    aucune(
      'Rattachements au-delà du rayon à pied',
      'SELECT count(*)::int AS n FROM lieu_gare WHERE distance_m > $1::int + 1',
      [rayons.lieuxGareM],
    ),
    aucune(
      'Gares dont gare_stats ne totalise pas leurs lignes de lieu_gare',
      `SELECT count(*)::int AS n FROM (
         SELECT gare_id, count(*) AS n FROM lieu_gare GROUP BY gare_id) lg
       FULL JOIN (SELECT gare_id, sum(nb_lieux) AS n FROM gare_stats GROUP BY gare_id) s
         USING (gare_id)
       WHERE lg.n IS DISTINCT FROM s.n`,
    ),
  ];
}

export interface BilanRattachements {
  controles: ResultatControle[];
  constats: string[];
  lienGare: number;
  aRelire: PaireRapport[];
  fusions: PaireRapport[];
}

/** Tout le calcul, dans la transaction de `client`. */
export async function calculerRattachementsDans(
  client: pg.ClientBase,
  lues: DecisionsLues = { decisions: [], rejets: [] },
): Promise<BilanRattachements> {
  const sections = await lireSections(
    new URL('../transformations/rattachements.sql', import.meta.url),
  );
  const valeurs = valeursRattachements();
  await poserDecisions(client, lues.decisions);
  let lienGare = 0;
  for (const nom of SECTIONS) {
    const sql = sections.get(nom);
    if (sql === undefined) throw new Error(`Section « ${nom} » absente de rattachements.sql`);
    const { texte, valeurs: liste } = preparer(sql, valeurs);
    const { rowCount } = await client.query(texte, liste);
    if (nom === 'lieu_gare') lienGare = rowCount ?? 0;
  }

  const controles = await executerControles(client, controlesRattachements(lues.rejets.length));
  if (echecsBloquants(controles).length > 0) throw new ErreurControles(controles);

  return {
    controles,
    constats: await constatsRattachements(client),
    lienGare,
    ...(await pairesRapport(client)),
  };
}

/** Calcul dans sa propre transaction. */
export function calculerRattachements(
  pool: pg.Pool,
  lues: DecisionsLues,
): Promise<BilanRattachements> {
  return enTransaction(pool, (client) => calculerRattachementsDans(client, lues));
}
