// Rattachements (docs/04-traitement-donnees.md § 4.6, D043) dans UNE transaction :
// sections de transformations/rattachements.sql → contrôles → constats et lignes des rapports.
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

const SECTIONS = [
  'reinitialiser',
  'noms',
  'index_noms',
  'paires',
  'doublons',
  'doublons_en_chaine',
  'completer',
  'groupes',
  'sites',
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
    rayon_m: p.rayons.lieuxGareM,
    coef_detour: p.marche.coefDetour,
    vitesse_kmh: p.marche.vitesseKmH,
  };
}

export function controlesRattachements(): Controle[] {
  const { rayons } = parametres;
  return [
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

export interface PaireRapport {
  garde: string;
  doublon: string;
  distance_m: number;
  similarite: number;
}

export interface BilanRattachements {
  controles: ResultatControle[];
  constats: string[];
  lienGare: number;
  aRelire: PaireRapport[];
  fusions: PaireRapport[];
}

const nombre = (n: number): string => n.toLocaleString('fr-FR');

const REQUETE_PAIRES = `
  SELECT g.source || ' : ' || g.nom AS garde, d.source || ' : ' || d.nom AS doublon,
         p.distance_m, round(p.similarite::numeric, 2)::float8 AS similarite
  FROM tmp_paire p JOIN lieu g ON g.id = p.garde JOIN lieu d ON d.id = p.doublon
  WHERE %CONDITION% ORDER BY p.similarite, p.distance_m`;

async function constatsRattachements(client: pg.ClientBase): Promise<string[]> {
  const { rows } = await client.query<Record<string, number>>(
    `SELECT
       (SELECT count(*)::int FROM lieu WHERE doublon_de IS NOT NULL) AS doublons,
       (SELECT count(DISTINCT site_de)::int FROM lieu WHERE site_de IS NOT NULL) AS sites,
       (SELECT count(*)::int FROM lieu WHERE site_de IS NOT NULL) AS membres,
       (SELECT count(*)::int FROM lieu_gare) AS liens,
       (SELECT count(DISTINCT lieu_id)::int FROM lieu_gare) AS lieux_rattaches,
       (SELECT count(*)::int FROM gare WHERE dans_region) AS gares_region,
       (SELECT count(DISTINCT lg.gare_id)::int FROM lieu_gare lg JOIN gare g ON g.id = lg.gare_id
        WHERE g.dans_region) AS gares_region_avec_lieux`,
  );
  const c = rows[0];
  if (!c) return [];
  return [
    `Doublons marqués : ${nombre(c.doublons ?? 0)}`,
    `Sites : ${nombre(c.sites ?? 0)} (${nombre(c.membres ?? 0)} lieux rattachés à un représentant)`,
    `Lieux à pied d’une gare : ${nombre(c.lieux_rattaches ?? 0)} (${nombre(c.liens ?? 0)} liens)`,
    `Gares de la région avec au moins un lieu : ${nombre(c.gares_region_avec_lieux ?? 0)} sur ${nombre(c.gares_region ?? 0)}`,
  ];
}

/** Tout le calcul, dans la transaction de `client`. */
export async function calculerRattachementsDans(
  client: pg.ClientBase,
): Promise<BilanRattachements> {
  const sections = await lireSections(
    new URL('../transformations/rattachements.sql', import.meta.url),
  );
  const valeurs = valeursRattachements();
  let lienGare = 0;
  for (const nom of SECTIONS) {
    const sql = sections.get(nom);
    if (sql === undefined) throw new Error(`Section « ${nom} » absente de rattachements.sql`);
    const { texte, valeurs: liste } = preparer(sql, valeurs);
    const { rowCount } = await client.query(texte, liste);
    if (nom === 'lieu_gare') lienGare = rowCount ?? 0;
  }

  const controles = await executerControles(client, controlesRattachements());
  if (echecsBloquants(controles).length > 0) throw new ErreurControles(controles);

  const paires = async (condition: string) =>
    (await client.query<PaireRapport>(REQUETE_PAIRES.replace('%CONDITION%', condition))).rows;
  return {
    controles,
    constats: await constatsRattachements(client),
    lienGare,
    aRelire: await paires('NOT p.fusion'),
    fusions: await paires('p.fusion'),
  };
}

/** Calcul dans sa propre transaction. */
export function calculerRattachements(pool: pg.Pool): Promise<BilanRattachements> {
  return enTransaction(pool, (client) => calculerRattachementsDans(client));
}
