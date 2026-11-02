-- Rattachements (docs/04-traitement-donnees.md § 4.6, D043, D044) : doublons → sites → lieu_gare → gare_stats.
-- Entrée : lieu, gare (E02, E05), tmp_decision (décisions manuelles, créée par le code). Sortie : lieu.doublon_de, lieu.site_de, lieu_gare, gare_stats.
-- Paramètres (parametres.json) : :distance_m, :similarite, :distance_large_m, :similarite_large,
-- :similarite_relire, :priorites (dedoublonnage) ; :sites (regroupementSites, JSON) ;
-- :rayon_m (rayons.lieuxGareM, distance À PIED), :coef_detour, :vitesse_kmh (marche).
-- Une section = une instruction, exécutées dans l'ordre par chargement/rattachements.ts.

-- @reinitialiser
-- Tout est recalculé à chaque fois : un rechargement de source peut avoir changé les lieux.
UPDATE lieu SET doublon_de = NULL, site_de = NULL
WHERE doublon_de IS NOT NULL OR site_de IS NOT NULL;

-- @noms
-- Nom comparable : minuscules, sans accents ni ponctuation (« Le Scènacle » = « Le Scénacle »).
-- Générique : le nom n'est que la sous-catégorie (« Aire de jeux »), jamais fusionné de loin.
CREATE TEMP TABLE tmp_nom ON COMMIT DROP AS
SELECT l.id, l.source, l.categorie, l.sous_categorie, l.geom,
       array_position(:priorites::text[], l.source) AS rang,
       trim(regexp_replace(lower(unaccent(l.nom)), '[^a-z0-9]+', ' ', 'g')) AS nom_comparable,
       trim(regexp_replace(lower(unaccent(l.nom)), '[^a-z0-9]+', ' ', 'g'))
         = trim(regexp_replace(lower(unaccent(coalesce(l.sous_categorie, ''))), '[^a-z0-9]+', ' ', 'g'))
         AS generique
FROM lieu l;

-- @index_noms
CREATE INDEX ON tmp_nom USING gist (geom);

-- @paires
-- Paires de lieux proches : g = gardé, d = doublon possible.
-- Entre sources (g = source prioritaire) : palier proche (< distance_m, nom semblable) ou palier large
-- (< distance_large_m, nom presque identique, même catégorie, nom non générique).
-- Dans une même source (g = plus petit id) : fusion seulement si les noms sont IDENTIQUES (non
-- génériques, < distance_m) ; nom seulement semblable = souvent une partie du lieu (« Parc du
-- château de X » et « Château de X ») : rapport à relire, jamais fusionné sans décision manuelle.
CREATE TEMP TABLE tmp_paire ON COMMIT DROP AS
WITH c AS (
  SELECT g.id AS garde, d.id AS doublon, g.source = d.source AS meme_source,
         ST_Distance(g.geom, d.geom) AS distance,
         similarity(g.nom_comparable, d.nom_comparable) AS similarite,
         g.nom_comparable = d.nom_comparable AS identique,
         g.categorie = d.categorie AS meme_categorie,
         g.generique OR d.generique AS generique
  FROM tmp_nom g
  JOIN tmp_nom d ON ST_DWithin(g.geom, d.geom, :distance_large_m::float8)
   AND (d.rang > g.rang OR (d.source = g.source AND d.id > g.id))
)
SELECT garde, doublon, meme_source, round(distance)::int AS distance_m, similarite,
       CASE WHEN meme_source THEN identique AND NOT generique AND distance < :distance_m::float8
            ELSE (distance < :distance_m::float8 AND similarite >= :similarite::float8)
              OR (similarite >= :similarite_large::float8 AND meme_categorie AND NOT generique)
       END AS fusion,
       NULL::text AS decision
FROM c
-- Même source et nom générique (« Aire de jeux ») : ni fusion ni relecture, le regroupement en site s'en charge.
WHERE CASE WHEN meme_source THEN distance < :distance_m::float8 AND similarite >= :similarite::float8
                                AND NOT generique
           ELSE (distance < :distance_m::float8 AND similarite >= :similarite_relire::float8)
             OR (similarite >= :similarite_large::float8 AND meme_categorie AND NOT generique)
      END;

-- @decisions
-- Décisions manuelles (regles/doublons_manuels.csv, D044) : lieux retrouvés par source + identifiant.
CREATE TEMP TABLE tmp_decision_id ON COMMIT DROP AS
SELECT g.id AS garde, d.id AS doublon, t.decision
FROM tmp_decision t
JOIN lieu g ON g.source = t.source_garde AND g.id_source = t.id_garde
JOIN lieu d ON d.source = t.source_doublon AND d.id_source = t.id_doublon
WHERE g.id <> d.id;

-- @retirer_paires_decidees
-- Une paire décidée remplace la paire calculée, quel que soit son sens.
DELETE FROM tmp_paire p USING tmp_decision_id t
WHERE (p.garde = t.garde AND p.doublon = t.doublon) OR (p.garde = t.doublon AND p.doublon = t.garde);

-- @ajouter_paires_decidees
-- « oui » : fusion, même loin ou peu semblable ; « non » : jamais fusionnée.
INSERT INTO tmp_paire (garde, doublon, meme_source, distance_m, similarite, fusion, decision)
SELECT t.garde, t.doublon, g.source = d.source, round(ST_Distance(g.geom, d.geom))::int,
       similarity(g.nom_comparable, d.nom_comparable), t.decision = 'oui', t.decision
FROM tmp_decision_id t
JOIN tmp_nom g ON g.id = t.garde
JOIN tmp_nom d ON d.id = t.doublon;

-- @choix
-- Chaque doublon pointe vers un seul lieu gardé : décision « oui » d'abord, puis nom le plus
-- semblable, puis le plus proche. 20 lieux OSM avaient deux candidats au 02/11 (château et parc du château).
CREATE TEMP TABLE tmp_choix ON COMMIT DROP AS
SELECT DISTINCT ON (doublon) doublon, garde
FROM tmp_paire WHERE fusion
ORDER BY doublon, (decision = 'oui') DESC NULLS LAST, similarite DESC, distance_m, garde;

-- @doublons
UPDATE lieu l SET doublon_de = c.garde FROM tmp_choix c WHERE l.id = c.doublon;

-- @doublons_en_chaine
-- Un lieu gardé peut lui-même être le doublon d'un autre (trois sources, même source, décision) :
-- exécuté plusieurs fois, chaque passe remonte d'un cran.
UPDATE lieu l SET doublon_de = c.doublon_de
FROM lieu c
WHERE l.doublon_de = c.id AND c.doublon_de IS NOT NULL AND c.doublon_de <> l.id;

-- @completer
-- Champs vides du lieu gardé complétés depuis ses doublons (photo, site web, horaires).
UPDATE lieu g SET
  image_url = coalesce(g.image_url, d.image_url),
  url = coalesce(g.url, d.url),
  horaires = coalesce(g.horaires, d.horaires),
  qualite_tourisme = g.qualite_tourisme OR d.qualite_tourisme
FROM (SELECT DISTINCT ON (doublon_de) doublon_de, image_url, url, horaires, qualite_tourisme
      FROM lieu WHERE doublon_de IS NOT NULL
      ORDER BY doublon_de, (image_url IS NULL), id) d
WHERE g.id = d.doublon_de
  AND ((g.image_url IS NULL AND d.image_url IS NOT NULL)
    OR (g.url IS NULL AND d.url IS NOT NULL)
    OR (g.horaires IS NULL AND d.horaires IS NOT NULL)
    OR (NOT g.qualite_tourisme AND d.qualite_tourisme));

-- @groupes
-- Sites : lieux (non doublons) d'une sous-catégorie listée, proches les uns des autres.
-- Lambert 93 (2154, France métropolitaine) : ST_ClusterDBSCAN demande des coordonnées en mètres.
-- Jamais tout le patrimoine : le centre de Dijon formerait un seul « site » de 92 monuments.
CREATE TEMP TABLE tmp_groupe ON COMMIT DROP AS
SELECT x.*
FROM jsonb_to_recordset(:sites::jsonb) AS r(sous_categorie text, distance_m int)
-- LATERAL : une sous-catégorie à la fois, avec SA distance (constante dans la fenêtre).
CROSS JOIN LATERAL (
  SELECT l.id, l.sous_categorie, l.geom, array_position(:priorites::text[], l.source) AS rang,
         ST_ClusterDBSCAN(ST_Transform(l.geom::geometry, 2154), eps := r.distance_m, minpoints := 2)
           OVER () AS groupe
  FROM lieu l
  WHERE l.sous_categorie = r.sous_categorie AND l.doublon_de IS NULL
) x;

-- @sites
-- Représentant : la source la plus prioritaire (« Grottes d'Arcy-sur-Cure », DATAtourisme), puis le
-- lieu le plus proche du centre du groupe. Les autres lieux du groupe pointent vers lui.
UPDATE lieu l SET site_de = r.representant
FROM (
  SELECT g.id, first_value(g.id) OVER (
           PARTITION BY g.sous_categorie, g.groupe
           ORDER BY g.rang, ST_Distance(g.geom, c.centre), g.id) AS representant
  FROM tmp_groupe g
  JOIN (SELECT sous_categorie, groupe, ST_Centroid(ST_Collect(geom::geometry))::geography AS centre
        FROM tmp_groupe WHERE groupe IS NOT NULL GROUP BY sous_categorie, groupe) c
    ON c.sous_categorie = g.sous_categorie AND c.groupe = g.groupe
) r
WHERE l.id = r.id AND r.representant <> r.id;

-- @vider_lieu_gare
DELETE FROM lieu_gare;

-- @lieu_gare
-- Distance à pied = distance à vol d'oiseau × coef_detour ; gardée si ≤ rayon_m (à pied, D043).
-- Lieu en longueur (canal) : distance au point de son tracé le plus proche, une ligne par gare.
INSERT INTO lieu_gare (lieu_id, gare_id, distance_m, duree_marche_min)
SELECT l.id, g.id,
       round(ST_Distance(coalesce(l.trace::geography, l.geom::geography), g.geom) * :coef_detour::float8)::int,
       ceil(ST_Distance(coalesce(l.trace::geography, l.geom::geography), g.geom) * :coef_detour::float8
            / (:vitesse_kmh::float8 * 1000 / 60.0))::smallint
FROM lieu l
JOIN gare g
  ON ST_DWithin(coalesce(l.trace::geography, l.geom::geography), g.geom, :rayon_m::float8 / :coef_detour::float8)
WHERE l.doublon_de IS NULL AND l.site_de IS NULL;

-- @vider_gare_stats
DELETE FROM gare_stats;

-- @gare_stats
INSERT INTO gare_stats (gare_id, categorie, nb_lieux)
SELECT lg.gare_id, l.categorie, count(*)
FROM lieu_gare lg JOIN lieu l ON l.id = lg.lieu_id
GROUP BY lg.gare_id, l.categorie;
