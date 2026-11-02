-- Rattachements (docs/04-traitement-donnees.md § 4.6, D043) : doublons → sites → lieu_gare → gare_stats.
-- Entrée : lieu, gare (E02, E05). Sortie : lieu.doublon_de, lieu.site_de, lieu_gare, gare_stats.
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
-- Paires entre sources différentes : g = source prioritaire (gardée), d = doublon possible.
-- Palier proche : < distance_m et nom semblable. Palier large : < distance_large_m, nom presque
-- identique, même catégorie, nom non générique (château dont le point diffère selon la source).
CREATE TEMP TABLE tmp_paire ON COMMIT DROP AS
SELECT g.id AS garde, d.id AS doublon,
       round(ST_Distance(g.geom, d.geom))::int AS distance_m,
       similarity(g.nom_comparable, d.nom_comparable) AS similarite,
       (ST_DWithin(g.geom, d.geom, :distance_m::float8)
          AND similarity(g.nom_comparable, d.nom_comparable) >= :similarite::float8)
       OR (similarity(g.nom_comparable, d.nom_comparable) >= :similarite_large::float8
          AND g.categorie = d.categorie AND NOT g.generique AND NOT d.generique) AS fusion
FROM tmp_nom g
JOIN tmp_nom d ON d.rang > g.rang AND ST_DWithin(g.geom, d.geom, :distance_large_m::float8)
WHERE (ST_DWithin(g.geom, d.geom, :distance_m::float8)
         AND similarity(g.nom_comparable, d.nom_comparable) >= :similarite_relire::float8)
   OR (similarity(g.nom_comparable, d.nom_comparable) >= :similarite_large::float8
         AND g.categorie = d.categorie AND NOT g.generique AND NOT d.generique);

-- @doublons
-- Chaque doublon pointe vers son meilleur lieu gardé : nom le plus semblable, puis le plus proche.
UPDATE lieu l SET doublon_de = m.garde
FROM (SELECT DISTINCT ON (doublon) doublon, garde
      FROM tmp_paire WHERE fusion
      ORDER BY doublon, similarite DESC, distance_m, garde) m
WHERE l.id = m.doublon;

-- @doublons_en_chaine
-- Trois sources ou plus : un lieu gardé peut lui-même être le doublon d'un lieu plus prioritaire.
UPDATE lieu l SET doublon_de = c.doublon_de
FROM lieu c
WHERE l.doublon_de = c.id AND c.doublon_de IS NOT NULL;

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
