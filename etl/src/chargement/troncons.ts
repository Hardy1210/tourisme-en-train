// Lieux en longueur (docs/04-traitement-donnees.md § 4.6, D043) : tronçons OSM d'un même canal
// réunis en un seul lieu, dans la table temporaire `tmp_lieu`, avant la recherche des communes.
import type pg from 'pg';
import { parametres } from '../config';

/**
 * Lieux en longueur (D043) : tronçons de même nom proches les uns des autres (`raccordTronconsM`)
 * réunis en un seul lieu, au plus petit identifiant ; son point = point du tracé le plus proche du
 * centre. Lambert 93 (2154) : distances en mètres pour ST_ClusterDBSCAN.
 */
export async function raccorderTroncons(client: pg.ClientBase): Promise<void> {
  await client.query(`ALTER TABLE tmp_lieu ADD COLUMN trace_geo geography(MultiLineString, 4326)`);
  await client.query(`UPDATE tmp_lieu SET trace_geo = ST_Multi(ST_GeomFromGeoJSON(trace))::geography
    WHERE trace IS NOT NULL`);
  await client.query('DROP TABLE IF EXISTS tmp_troncon');
  await client.query(
    `CREATE TEMP TABLE tmp_troncon ON COMMIT DROP AS
     SELECT id_source, nom, ST_ClusterDBSCAN(ST_Transform(trace_geo::geometry, 2154),
              eps := $1::float8, minpoints := 1) OVER (PARTITION BY nom) AS groupe
     FROM tmp_lieu WHERE trace_geo IS NOT NULL`,
    [parametres.lieux.raccordTronconsM],
  );
  await client.query(`WITH g AS (
      SELECT min(t.id_source) AS garde, array_agg(t.id_source) AS membres,
             ST_Multi(ST_LineMerge(ST_Union(l.trace_geo::geometry))) AS trace
      FROM tmp_troncon t JOIN tmp_lieu l USING (id_source)
      GROUP BY t.nom, t.groupe)
    UPDATE tmp_lieu l SET trace_geo = g.trace::geography,
      lon = ST_X(ST_ClosestPoint(g.trace, ST_Centroid(g.trace))),
      lat = ST_Y(ST_ClosestPoint(g.trace, ST_Centroid(g.trace)))
    FROM g WHERE l.id_source = g.garde`);
  await client.query(`DELETE FROM tmp_lieu l USING tmp_troncon t
    WHERE l.id_source = t.id_source AND l.id_source <> (
      SELECT min(u.id_source) FROM tmp_troncon u WHERE u.nom = t.nom AND u.groupe = t.groupe)`);
}
