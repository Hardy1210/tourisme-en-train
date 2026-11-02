// Constats et rapports à relire des rattachements (docs/04-traitement-donnees.md § 4.6, D043, D044),
// lus dans la transaction, avant la suppression des tables temporaires.
import type pg from 'pg';

/** Une paire de lieux, dans le format de `regles/doublons_manuels.csv` (copiable telle quelle). */
export interface PaireRapport {
  source_garde: string;
  id_garde: string;
  nom_garde: string;
  source_doublon: string;
  id_doublon: string;
  nom_doublon: string;
  distance_m: number;
  similarite: number;
  decision: string;
}

const REQUETE_PAIRES = `
  SELECT g.source AS source_garde, g.id_source AS id_garde, g.nom AS nom_garde,
         d.source AS source_doublon, d.id_source AS id_doublon, d.nom AS nom_doublon,
         p.distance_m, round(p.similarite::numeric, 2)::float8 AS similarite,
         coalesce(p.decision, '') AS decision
  FROM tmp_paire p JOIN lieu g ON g.id = p.garde JOIN lieu d ON d.id = p.doublon
  WHERE %CONDITION%
  ORDER BY p.meme_source, p.similarite, p.distance_m, g.id_source, d.id_source`;

/** Paires fusionnées (seulement la paire retenue pour chaque doublon) et paires à relire. */
export async function pairesRapport(
  client: pg.ClientBase,
): Promise<{ fusions: PaireRapport[]; aRelire: PaireRapport[] }> {
  const lire = async (condition: string) =>
    (await client.query<PaireRapport>(REQUETE_PAIRES.replace('%CONDITION%', condition))).rows;
  return {
    fusions: await lire(
      'EXISTS (SELECT 1 FROM tmp_choix c WHERE c.doublon = p.doublon AND c.garde = p.garde)',
    ),
    // Déjà décidées (oui ou non) : sorties de la liste à relire.
    aRelire: await lire('NOT p.fusion AND p.decision IS NULL'),
  };
}

const nombre = (n: number): string => n.toLocaleString('fr-FR');

export async function constatsRattachements(client: pg.ClientBase): Promise<string[]> {
  const { rows } = await client.query<Record<string, number>>(
    `SELECT
       (SELECT count(*)::int FROM lieu WHERE doublon_de IS NOT NULL) AS doublons,
       (SELECT count(*)::int FROM tmp_choix c JOIN tmp_paire p USING (doublon, garde)
        WHERE p.meme_source) AS meme_source,
       (SELECT count(*)::int FROM tmp_decision_id WHERE decision = 'oui') AS oui,
       (SELECT count(*)::int FROM tmp_decision_id WHERE decision = 'non') AS non,
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
  const n = (cle: string): string => nombre(c[cle] ?? 0);
  return [
    `Doublons marqués : ${n('doublons')} (dont ${n('meme_source')} dans une même source)`,
    `Décisions manuelles appliquées : ${n('oui')} oui, ${n('non')} non`,
    `Sites : ${n('sites')} (${n('membres')} lieux rattachés à un représentant)`,
    `Lieux à pied d’une gare : ${n('lieux_rattaches')} (${n('liens')} liens)`,
    `Gares de la région avec au moins un lieu : ${n('gares_region_avec_lieux')} sur ${n('gares_region')}`,
  ];
}
