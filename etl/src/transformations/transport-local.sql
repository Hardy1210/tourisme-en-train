-- Transports sur place (docs/04-traitement-donnees.md § 4.7, D046).
-- Entrée : tmp_arret (arrêts et stations de tous les réseaux, remplie par le code), gare.
-- Sortie : mobilite_locale, une ligne par couple (arrêt, gare) à pied de la gare.
-- Paramètres : :regroupement_m (mobilite.regroupementQuaisM), :rayon_m (rayons.mobiliteM, À PIED),
-- :coef_detour (marche.coefDetour).

-- @position
UPDATE tmp_arret SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography;

-- @quais
-- Quais opposés : arrêts de même nom (sans majuscules ni accents) d'un même réseau, de proche en
-- proche à moins de :regroupement_m. Lambert 93 (2154) : ST_ClusterDBSCAN demande des mètres.
CREATE TEMP TABLE tmp_quai ON COMMIT DROP AS
SELECT a.*, ST_ClusterDBSCAN(ST_Transform(a.geom::geometry, 2154),
         eps := :regroupement_m::float8, minpoints := 1)
         OVER (PARTITION BY a.source, lower(unaccent(a.nom))) AS groupe
FROM tmp_arret a;

-- @arrets
-- Un arrêt par groupe : plus petit identifiant, lignes réunies, centre des quais ; TRAM si un quai
-- est desservi par le tram.
CREATE TEMP TABLE tmp_arret_groupe ON COMMIT DROP AS
SELECT q.source, min(q.id_source) AS id_source, min(q.nom) AS nom,
       CASE WHEN bool_or(q.type = 'TRAM') THEN 'TRAM' ELSE min(q.type) END AS type,
       -- Lignes de tous les quais, sans doublon, « 2 » avant « 10 » (longueur puis texte).
       (SELECT array_agg(l ORDER BY length(l), l) FROM (
          SELECT DISTINCT l FROM unnest(string_to_array(
            string_agg(array_to_string(q.lignes, chr(31)), chr(31)), chr(31))) AS l) d) AS lignes,
       ST_Centroid(ST_Collect(q.geom::geometry))::geography AS geom
FROM tmp_quai q
GROUP BY q.source, lower(unaccent(q.nom)), q.groupe;

-- @index_arrets
CREATE INDEX ON tmp_arret_groupe USING gist (geom);

-- @vider
DELETE FROM mobilite_locale;

-- @inserer
-- Distance à pied = vol d'oiseau × coef_detour, gardée si ≤ :rayon_m (D046, comme D043).
INSERT INTO mobilite_locale (gare_id, type, nom, lignes, operateur, source, id_source, distance_m, geom)
SELECT g.id, a.type, a.nom, a.lignes, s.producteur, a.source, a.id_source,
       round(ST_Distance(a.geom, g.geom) * :coef_detour::float8)::int, a.geom
FROM tmp_arret_groupe a
JOIN gare g ON g.dans_region AND ST_DWithin(a.geom, g.geom, :rayon_m::float8 / :coef_detour::float8)
JOIN source_donnees s ON s.code = a.source;
