-- ============================================================================
-- DONNÉES D'EXEMPLE — NE SONT PAS DE VRAIES DONNÉES (docs/03-base-de-donnees.md § 6)
-- Chargées UNIQUEMENT dans la base de test par `pnpm db:test:preparer`, jamais dans `tourisme`.
-- Tout est rattaché à la source `echantillon` ; codes UIC fictifs (`EX…`) ;
-- positions des gares proches de la réalité, horaires et lieux inventés.
-- ============================================================================

BEGIN;

INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution)
VALUES ('echantillon', 'Échantillon de test (données d''exemple)', 'tourisme-en-train',
        'https://example.org/echantillon', 'Aucune (données inventées)', 'Données d''exemple');

-- Communes des gares et des lieux d'exemple (vrais codes INSEE).
INSERT INTO commune (code_insee, nom, departement) VALUES
  ('21231', 'Dijon',            '21'),
  ('21054', 'Beaune',           '21'),
  ('39198', 'Dole',             '39'),
  ('25056', 'Besançon',         '25'),
  ('71076', 'Chalon-sur-Saône', '71'),
  ('71270', 'Mâcon',            '71'),
  ('21425', 'Montbard',         '21'),
  ('89024', 'Auxerre',          '89'),
  ('90010', 'Belfort',          '90'),
  ('69383', 'Lyon',             '69');

-- 10 gares : 9 dans la région, Lyon-Part-Dieu hors région (4 de plus en fin de fichier, E08).
INSERT INTO gare (uic, codes_uic, nom, code_insee, dans_region, geom)
SELECT uic, ARRAY[uic], nom, insee, dans_region, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
FROM (VALUES
  ('EX000001', 'Dijon-Ville',           '21231', true,  5.0272, 47.3233),
  ('EX000002', 'Beaune',                '21054', true,  4.8436, 47.0237),
  ('EX000003', 'Dole-Ville',            '39198', true,  5.4935, 47.0926),
  ('EX000004', 'Besançon-Viotte',       '25056', true,  6.0217, 47.2471),
  ('EX000005', 'Chalon-sur-Saône',      '71076', true,  4.8429, 46.7815),
  ('EX000006', 'Mâcon-Ville',           '71270', true,  4.8268, 46.3017),
  ('EX000007', 'Montbard',              '21425', true,  4.3381, 47.6239),
  ('EX000008', 'Auxerre-Saint-Gervais', '89024', true,  3.5800, 47.7926),
  ('EX000009', 'Belfort-Ville',         '90010', true,  6.8550, 47.6338),
  ('EX000010', 'Lyon-Part-Dieu',        '69383', false, 4.8597, 45.7605)
) AS g (uic, nom, insee, dans_region, lon, lat);

-- Jours de circulation : une date d'été et une date d'hiver (après le changement d'heure du 25/10/2026).
INSERT INTO service_jour (service_id, date_service) VALUES
  ('ECH_SEMAINE', '2026-07-15'),
  ('ECH_SEMAINE', '2026-11-18'),
  ('ECH_ETE',     '2026-07-15');

INSERT INTO trajet (id, service_id, type_train, nom_ligne, numero) VALUES
  ('ECH_T1', 'ECH_SEMAINE', 'TER', 'Dijon - Lyon',     '891001'),
  ('ECH_T2', 'ECH_SEMAINE', 'TER', 'Lyon - Dijon',     '891002'),
  ('ECH_T3', 'ECH_ETE',     'TER', 'Dijon - Besançon', '894001'),
  ('ECH_T4', 'ECH_SEMAINE', 'TER', 'Dijon - Beaune',   '891003'),
  ('ECH_T5', 'ECH_SEMAINE', 'TGV', 'Dijon - Lyon',     '6701');

-- Horaires en secondes depuis minuit ; ECH_T4 arrive après minuit (24:15:00 = 87 300 s).
INSERT INTO passage (trajet_id, sequence, gare_id, arrivee_s, depart_s)
SELECT p.trajet_id, p.sequence, g.id, p.arrivee_s, p.depart_s
FROM (VALUES
  ('ECH_T1', 1, 'EX000001', NULL,  25200),
  ('ECH_T1', 2, 'EX000002', 26520, 26580),
  ('ECH_T1', 3, 'EX000005', 27600, 27660),
  ('ECH_T1', 4, 'EX000006', 29400, 29460),
  ('ECH_T1', 5, 'EX000010', 32700, NULL),
  ('ECH_T2', 1, 'EX000010', NULL,  61200),
  ('ECH_T2', 2, 'EX000006', 64500, 64560),
  ('ECH_T2', 3, 'EX000005', 66300, 66360),
  ('ECH_T2', 4, 'EX000002', 67380, 67440),
  ('ECH_T2', 5, 'EX000001', 68760, NULL),
  ('ECH_T3', 1, 'EX000001', NULL,  28800),
  ('ECH_T3', 2, 'EX000003', 30600, 30660),
  ('ECH_T3', 3, 'EX000004', 32400, NULL),
  ('ECH_T4', 1, 'EX000001', NULL,  85800),
  ('ECH_T4', 2, 'EX000002', 87300, NULL),
  ('ECH_T5', 1, 'EX000001', NULL,  36000),
  ('ECH_T5', 2, 'EX000010', 42000, NULL)
) AS p (trajet_id, sequence, uic, arrivee_s, depart_s)
JOIN gare g ON g.uic = p.uic;

-- 30 lieux inventés près des gares. `Exemple` dans le nom : impossible de les confondre avec de vrais lieux.
INSERT INTO lieu (source, id_source, nom, categorie, sous_categorie, description, code_insee, geom)
SELECT 'echantillon', l.id_source, l.nom, l.categorie, l.sous_categorie, 'Donnée d''exemple.',
       l.insee, ST_SetSRID(ST_MakePoint(l.lon, l.lat), 4326)::geography
FROM (VALUES
  ('ECH_L01', 'Exemple - Aire de jeux du centre',      'enfants',    'aire de jeux',     'Dijon',            '21231', 5.0330, 47.3240),
  ('ECH_L02', 'Exemple - Jardin botanique',            'parcs',      'jardin',           'Dijon',            '21231', 5.0300, 47.3260),
  ('ECH_L03', 'Exemple - Palais historique',           'patrimoine', 'palais',           'Dijon',            '21231', 5.0410, 47.3220),
  ('ECH_L04', 'Exemple - Musée des beaux-arts',        'culture',    'musée',            'Dijon',            '21231', 5.0420, 47.3215),
  ('ECH_L05', 'Exemple - Lac et sentier',              'nature',     'lac',              'Dijon',            '21231', 4.9900, 47.3150),
  ('ECH_L06', 'Exemple - Parc de la ville',            'parcs',      'parc',             'Dijon',            '21231', 5.0500, 47.3100),
  ('ECH_L07', 'Exemple - Ludothèque',                  'enfants',    'ludothèque',       'Dijon',            '21231', 5.0250, 47.3300),
  ('ECH_L08', 'Exemple - Église romane',               'patrimoine', 'église',           'Dijon',            '21231', 5.0380, 47.3270),
  ('ECH_L09', 'Exemple - Théâtre',                     'culture',    'théâtre',          'Dijon',            '21231', 5.0350, 47.3230),
  ('ECH_L10', 'Exemple - Combe boisée (loin)',         'nature',     'forêt',            'Dijon',            '21231', 4.9500, 47.3500),
  ('ECH_L11', 'Exemple - Hospices',                    'patrimoine', 'monument',         'Beaune',           '21054', 4.8380, 47.0220),
  ('ECH_L12', 'Exemple - Remparts',                    'patrimoine', 'remparts',         'Beaune',           '21054', 4.8400, 47.0250),
  ('ECH_L13', 'Exemple - Parc de la source',           'parcs',      'parc',             'Beaune',           '21054', 4.8300, 47.0300),
  ('ECH_L14', 'Exemple - Musée du vin',                'culture',    'musée',            'Beaune',           '21054', 4.8390, 47.0230),
  ('ECH_L15', 'Exemple - Aire de jeux des remparts',   'enfants',    'aire de jeux',     'Beaune',           '21054', 4.8420, 47.0260),
  ('ECH_L16', 'Exemple - Montagne de Beaune',          'nature',     'point de vue',     'Beaune',           '21054', 4.8200, 47.0400),
  ('ECH_L17', 'Exemple - Hospices (doublon)',          'patrimoine', 'monument',         'Beaune',           '21054', 4.8381, 47.0221),
  ('ECH_L18', 'Exemple - Citadelle',                   'patrimoine', 'citadelle',        'Besançon',         '25056', 6.0330, 47.2310),
  ('ECH_L19', 'Exemple - Muséum et zoo',               'enfants',    'zoo',              'Besançon',         '25056', 6.0320, 47.2320),
  ('ECH_L20', 'Exemple - Promenade des bords du Doubs','nature',     'promenade',        'Besançon',         '25056', 6.0250, 47.2420),
  ('ECH_L21', 'Exemple - Parc Micaud',                 'parcs',      'parc',             'Besançon',         '25056', 6.0330, 47.2400),
  ('ECH_L22', 'Exemple - Musée du temps',              'culture',    'musée',            'Besançon',         '25056', 6.0240, 47.2370),
  ('ECH_L23', 'Exemple - Cathédrale',                  'patrimoine', 'cathédrale',       'Besançon',         '25056', 6.0300, 47.2350),
  ('ECH_L24', 'Exemple - Maison natale',               'culture',    'maison d''écrivain','Dole',             '39198', 5.4920, 47.0920),
  ('ECH_L25', 'Exemple - Canal des tanneurs',          'patrimoine', 'quartier',         'Dole',             '39198', 5.4900, 47.0910),
  ('ECH_L26', 'Exemple - Forêt de Chaux',              'nature',     'forêt',            'Dole',             '39198', 5.6500, 47.0800),
  ('ECH_L27', 'Exemple - Musée de la photographie',    'culture',    'musée',            'Chalon-sur-Saône', '71076', 4.8550, 46.7810),
  ('ECH_L28', 'Exemple - Roseraie',                    'parcs',      'jardin',           'Chalon-sur-Saône', '71076', 4.8700, 46.7900),
  ('ECH_L29', 'Exemple - Base de loisirs',             'enfants',    'base de loisirs',  'Chalon-sur-Saône', '71076', 4.8800, 46.7750),
  ('ECH_L30', 'Exemple - Cité médiévale',              'patrimoine', 'cité',             'Montbard',         '21425', 4.3370, 47.6240)
) AS l (id_source, nom, categorie, sous_categorie, commune, insee, lon, lat);

-- Un doublon fusionné : les requêtes de l'application doivent l'ignorer.
UPDATE lieu SET doublon_de = (SELECT id FROM lieu WHERE id_source = 'ECH_L11')
WHERE id_source = 'ECH_L17';

-- Quelques transports sur place autour de Dijon-Ville.
INSERT INTO mobilite_locale (gare_id, type, nom, lignes, operateur, source, id_source, distance_m, geom)
SELECT g.id, m.type, m.nom, m.lignes, 'Réseau exemple', 'echantillon', m.id_source, m.distance_m,
       ST_SetSRID(ST_MakePoint(m.lon, m.lat), 4326)::geography
FROM (VALUES
  ('TRAM', 'Exemple - Arrêt Gare',      ARRAY['T1', 'T2'], 'ECH_M1', 80,  5.0280, 47.3235),
  ('BUS',  'Exemple - Arrêt Darcy',     ARRAY['L3'],       'ECH_M2', 450, 5.0330, 47.3225),
  ('VELO', 'Exemple - Station vélos',   NULL,              'ECH_M3', 120, 5.0285, 47.3240)
) AS m (type, nom, lignes, id_source, distance_m, lon, lat)
JOIN gare g ON g.uic = 'EX000001';

-- ----------------------------------------------------------------------------
-- E08 — destinations (D047) : une ville à deux gares (Paris), une gare de la même commune que
-- Dijon-Ville, une gare de la région sans lieu (Velars-sur-Ouche ; Mâcon-Ville n'en a pas non plus).
-- Identifiants EX00002x / ECH_T2x : les tests de l'ETL utilisent EX000011 et ECH_T6 → T8.
-- ----------------------------------------------------------------------------
INSERT INTO commune (code_insee, nom, departement) VALUES
  ('75112', 'Paris',            '75'),   -- arrondissement (12ᵉ) : nom de la commune de rattachement
  ('21661', 'Velars-sur-Ouche', '21'),
  ('25035', 'Les Auxons',       '25');

-- Dijon-Porte-Neuve : position décalée volontairement (hors des rayons des tests de rattachement).
INSERT INTO gare (uic, codes_uic, nom, code_insee, dans_region, geom)
SELECT uic, ARRAY[uic], nom, insee, dans_region, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
FROM (VALUES
  ('EX000021', 'Paris-Gare-de-Lyon', '75112', false, 2.3735, 48.8443),
  ('EX000022', 'Paris-Bercy',        '75112', false, 2.3826, 48.8391),
  ('EX000023', 'Dijon-Porte-Neuve',  '21231', true,  4.9800, 47.3600),
  ('EX000024', 'Velars-sur-Ouche',   '21661', true,  4.9050, 47.3200),
  -- Gares TGV hors de leur ville (D049) : leur propre carte, même dans la commune d'une gare de ville.
  ('EX000025', 'Besançon Franche-Comté TGV', '25035', true, 5.9550, 47.3070),
  ('EX000026', 'Mâcon Loché TGV',            '71270', true, 4.7790, 46.2820)
) AS g (uic, nom, insee, dans_region, lon, lat);

INSERT INTO trajet (id, service_id, type_train, nom_ligne, numero) VALUES
  ('ECH_T21', 'ECH_SEMAINE', 'TGV', 'Dijon - Paris',            '6702'),
  ('ECH_T22', 'ECH_SEMAINE', 'TGV', 'Dijon - Paris',            '6704'),
  ('ECH_T23', 'ECH_SEMAINE', 'TER', 'Dijon - Paris Bercy',      '891005'),
  ('ECH_T24', 'ECH_SEMAINE', 'TER', 'Dijon - Velars-sur-Ouche', '891007'),
  ('ECH_T25', 'ECH_SEMAINE', 'TGV', 'Paris - Dijon',            '6703');

INSERT INTO passage (trajet_id, sequence, gare_id, arrivee_s, depart_s)
SELECT p.trajet_id, p.sequence, g.id, p.arrivee_s, p.depart_s
FROM (VALUES
  ('ECH_T21', 1, 'EX000001', NULL,  28800),   -- 08:00 → 09:36
  ('ECH_T21', 2, 'EX000021', 34560, NULL),
  ('ECH_T22', 1, 'EX000001', NULL,  43200),   -- 12:00 → 13:36
  ('ECH_T22', 2, 'EX000021', 48960, NULL),
  ('ECH_T23', 1, 'EX000001', NULL,  21600),   -- 06:00 → 08:52
  ('ECH_T23', 2, 'EX000022', 31920, NULL),
  ('ECH_T24', 1, 'EX000001', NULL,  32400),   -- 09:00 → 09:07 → 09:15
  ('ECH_T24', 2, 'EX000023', 32820, 32880),
  ('ECH_T24', 3, 'EX000024', 33300, NULL),
  ('ECH_T25', 1, 'EX000021', NULL,  64800),   -- 18:00 → 19:36
  ('ECH_T25', 2, 'EX000001', 70560, NULL)
) AS p (trajet_id, sequence, uic, arrivee_s, depart_s)
JOIN gare g ON g.uic = p.uic;

-- Liaisons directes au départ de Dijon-Ville (et leurs retours), écrites à la main d'après les
-- horaires ci-dessus, comme `pnpm etl liaisons` les calculerait. Distance : vol d'oiseau × 1,2.
INSERT INTO liaison_directe (gare_depart_id, gare_arrivee_id, date_service, duree_min, nb_trains,
  premier_depart_s, dernier_depart_s, premiere_arrivee_s, types_train, distance_km, faisable_journee)
SELECT gd.id, ga.id, j.jour::date, l.duree, l.nb, l.premier, l.dernier, l.arrivee, l.types,
       round((ST_Distance(gd.geom, ga.geom) / 1000 * 1.2)::numeric, 1), l.faisable
FROM (VALUES
  ('EX000001', 'EX000002', 22,  2, 25200, 85800, 26520, '{TER}'::text[],     true),
  ('EX000001', 'EX000005', 40,  1, 25200, 25200, 27600, '{TER}'::text[],     true),
  ('EX000001', 'EX000006', 70,  1, 25200, 25200, 29400, '{TER}'::text[],     true),
  ('EX000001', 'EX000010', 100, 2, 25200, 36000, 32700, '{TER,TGV}'::text[], true),
  ('EX000001', 'EX000021', 96,  2, 28800, 43200, 34560, '{TGV}'::text[],     true),
  ('EX000001', 'EX000022', 172, 1, 21600, 21600, 31920, '{TER}'::text[],     false),
  ('EX000001', 'EX000023', 7,   1, 32400, 32400, 32820, '{TER}'::text[],     false),
  ('EX000001', 'EX000024', 15,  1, 32400, 32400, 33300, '{TER}'::text[],     false),
  ('EX000001', 'EX000025', 26,  1, 37800, 37800, 39360, '{TGV}'::text[],     false),
  ('EX000001', 'EX000026', 60,  1, 39600, 39600, 43200, '{TGV}'::text[],     false),
  ('EX000002', 'EX000001', 22,  1, 67440, 67440, 68760, '{TER}'::text[],     false),
  ('EX000005', 'EX000001', 40,  1, 66360, 66360, 68760, '{TER}'::text[],     false),
  ('EX000006', 'EX000001', 70,  1, 64560, 64560, 68760, '{TER}'::text[],     false),
  ('EX000010', 'EX000001', 126, 1, 61200, 61200, 68760, '{TER}'::text[],     false),
  ('EX000021', 'EX000001', 96,  1, 64800, 64800, 70560, '{TGV}'::text[],     false)
) AS l (depart, arrivee_uic, duree, nb, premier, dernier, arrivee, types, faisable)
CROSS JOIN (VALUES ('2026-07-15'), ('2026-11-18')) AS j (jour)
JOIN gare gd ON gd.uic = l.depart
JOIN gare ga ON ga.uic = l.arrivee_uic;

-- Été seulement (ECH_ETE) : Dijon → Dole, Dijon → Besançon.
INSERT INTO liaison_directe (gare_depart_id, gare_arrivee_id, date_service, duree_min, nb_trains,
  premier_depart_s, dernier_depart_s, premiere_arrivee_s, types_train, distance_km, faisable_journee)
SELECT gd.id, ga.id, '2026-07-15', l.duree, 1, 28800, 28800, l.arrivee, '{TER}',
       round((ST_Distance(gd.geom, ga.geom) / 1000 * 1.2)::numeric, 1), false
FROM (VALUES ('EX000003', 30, 30600), ('EX000004', 60, 32400)) AS l (arrivee_uic, duree, arrivee)
JOIN gare gd ON gd.uic = 'EX000001'
JOIN gare ga ON ga.uic = l.arrivee_uic;

-- Lieux à pied de chaque gare (comme `pnpm etl rattachements`), d'après les lieux d'exemple.
-- Mâcon-Ville, Dijon-Porte-Neuve, Velars-sur-Ouche, Mâcon Loché TGV : aucun lieu ; Lyon et Paris : hors
-- région. Chalon (1), Besançon TGV (2), Dole (2) : moins de 3 lieux (D050).
INSERT INTO gare_stats (gare_id, categorie, nb_lieux)
SELECT g.id, s.categorie, s.nb
FROM (VALUES
  ('EX000002', 'patrimoine', 2), ('EX000002', 'parcs', 1), ('EX000002', 'culture', 1),
  ('EX000002', 'enfants', 1),
  ('EX000003', 'culture', 1), ('EX000003', 'patrimoine', 1),
  ('EX000004', 'nature', 1), ('EX000004', 'culture', 1), ('EX000004', 'parcs', 1),
  ('EX000005', 'culture', 1),
  ('EX000025', 'enfants', 2),
  ('EX000007', 'patrimoine', 1)
) AS s (uic, categorie, nb)
JOIN gare g ON g.uic = s.uic;

-- ----------------------------------------------------------------------------
-- E09 — fiche destination, trains, lieux (D051, D052)
-- ----------------------------------------------------------------------------
-- Chalon-sur-Saône a un second code UIC : une route doit trouver la gare par l'un ou l'autre (D039).
UPDATE gare SET codes_uic = codes_uic || 'EX000095'::char(8) WHERE uic = 'EX000005';

-- Train en jumelage (D040) : mêmes heures que ECH_T1 jusqu'à Beaune, autre numéro → un seul train.
INSERT INTO trajet (id, service_id, type_train, nom_ligne, numero) VALUES
  ('ECH_T26', 'ECH_SEMAINE', 'TER', 'Dijon - Beaune', '891099');
INSERT INTO passage (trajet_id, sequence, gare_id, arrivee_s, depart_s)
SELECT p.trajet_id, p.sequence, g.id, p.arrivee_s, p.depart_s
FROM (VALUES ('ECH_T26', 1, 'EX000001', NULL, 25200), ('ECH_T26', 2, 'EX000002', 26520, NULL))
  AS p (trajet_id, sequence, uic, arrivee_s, depart_s)
JOIN gare g ON g.uic = p.uic;

-- Retour Beaune → Dijon à 07:10, AVANT l'arrivée du premier aller (07:22) : jamais proposé (D051).
INSERT INTO trajet (id, service_id, type_train, nom_ligne, numero) VALUES
  ('ECH_T27', 'ECH_SEMAINE', 'TER', 'Beaune - Dijon', '891098');
INSERT INTO passage (trajet_id, sequence, gare_id, arrivee_s, depart_s)
SELECT p.trajet_id, p.sequence, g.id, p.arrivee_s, p.depart_s
FROM (VALUES ('ECH_T27', 1, 'EX000002', NULL, 25800), ('ECH_T27', 2, 'EX000001', 27120, NULL))
  AS p (trajet_id, sequence, uic, arrivee_s, depart_s)
JOIN gare g ON g.uic = p.uic;
UPDATE liaison_directe l SET nb_trains = 2, premier_depart_s = 25800, premiere_arrivee_s = 27120
FROM gare d, gare a
WHERE l.gare_depart_id = d.id AND d.uic = 'EX000002' AND l.gare_arrivee_id = a.id AND a.uic = 'EX000001';

-- Membre d'un site : jamais listé ; un lien vers lui mène au représentant (D052).
UPDATE lieu SET site_de = (SELECT id FROM lieu WHERE id_source = 'ECH_L13')
WHERE id_source = 'ECH_L16';

-- Lieux à pied de chaque gare, calculés comme `pnpm etl rattachements` (vol d'oiseau × 1,3,
-- 1 500 m au plus ; doublons et membres de site exclus). `gare_stats` plus haut reste écrit à la
-- main pour les tests du classement (D050) : les deux ne coïncident pas exactement.
INSERT INTO lieu_gare (lieu_id, gare_id, distance_m, duree_marche_min)
SELECT l.id, g.id, round(ST_Distance(l.geom, g.geom) * 1.3)::int,
       ceil(ST_Distance(l.geom, g.geom) * 1.3 / 75)::smallint
FROM lieu l JOIN gare g ON ST_DWithin(l.geom, g.geom, 1500 / 1.3)
WHERE l.doublon_de IS NULL AND l.site_de IS NULL;

-- ----------------------------------------------------------------------------
-- E11 — onglet Lieux (/api/lieux, D056)
-- ----------------------------------------------------------------------------
-- Dijon-Porte-Neuve dessert Dijon-Ville (même commune : écartée), Beaune et Chalon.
INSERT INTO liaison_directe (gare_depart_id, gare_arrivee_id, date_service, duree_min, nb_trains,
  premier_depart_s, dernier_depart_s, premiere_arrivee_s, types_train, distance_km, faisable_journee)
SELECT gd.id, ga.id, '2026-11-18', l.duree, 1, 28800, 28800, 28800 + l.duree * 60, '{TER}',
       round((ST_Distance(gd.geom, ga.geom) / 1000 * 1.2)::numeric, 1), false
FROM (VALUES ('EX000001', 6), ('EX000002', 30), ('EX000005', 50)) AS l (arrivee_uic, duree)
JOIN gare gd ON gd.uic = 'EX000023'
JOIN gare ga ON ga.uic = l.arrivee_uic;

-- Gare conseillée (D064) : Dijon-Porte-Neuve dessert Dole les deux jours, avec moins de trains que
-- Dijon-Ville. Le 10/11, Dijon-Ville ne dessert pas Dole ; le 11/11, si.
INSERT INTO liaison_directe (gare_depart_id, gare_arrivee_id, date_service, duree_min, nb_trains,
  premier_depart_s, dernier_depart_s, premiere_arrivee_s, types_train, distance_km, faisable_journee)
SELECT gd.id, ga.id, l.jour::date, 30, l.nb, 28800, 28800, 30600, '{TER}',
       round((ST_Distance(gd.geom, ga.geom) / 1000 * 1.2)::numeric, 1), false
FROM (VALUES
  ('EX000023', 'EX000003', '2026-11-10', 1),
  ('EX000001', 'EX000002', '2026-11-10', 5),
  ('EX000023', 'EX000003', '2026-11-11', 1),
  ('EX000001', 'EX000003', '2026-11-11', 5)
) AS l (depart, arrivee_uic, jour, nb)
JOIN gare gd ON gd.uic = l.depart
JOIN gare ga ON ga.uic = l.arrivee_uic;

-- Lieux placés loin de tout, rattachés à la main pour tester chaque règle.
INSERT INTO lieu (source, id_source, nom, categorie, sous_categorie, description, code_insee, geom)
SELECT 'echantillon', l.id_source, l.nom, 'nature', 'belvédère', 'Donnée d''exemple.', '71076',
       ST_SetSRID(ST_MakePoint(6.9, 46.3), 4326)::geography
FROM (VALUES
  ('ECH_L40', 'Exemple - Belvédère entre deux gares'),
  ('ECH_L41', 'Exemple - Belvédère à pied du départ')
) AS l (id_source, nom);

INSERT INTO lieu_gare (lieu_id, gare_id, distance_m, duree_marche_min)
SELECT l.id, g.id, r.distance, r.marche
FROM (VALUES
  ('ECH_L40', 'EX000005', 1400, 19), ('ECH_L40', 'EX000006', 80, 1),
  ('ECH_L41', 'EX000023', 100, 2), ('ECH_L41', 'EX000005', 100, 2)
) AS r (id_source, uic, distance, marche)
JOIN lieu l ON l.id_source = r.id_source
JOIN gare g ON g.uic = r.uic;

-- D057 : fiche de ville (jamais listée) et lieux retirés de l'onglet Lieux seulement, au même point.
-- Piscines et centres aquatiques : plus chargés en base (acces.sousCategoriesRetirees, D091).
INSERT INTO lieu (source, id_source, nom, categorie, sous_categorie, description, code_insee, geom, fiche_ville)
SELECT 'echantillon', l.id_source, l.nom, l.categorie, l.sous_categorie, 'Donnée d''exemple.', '71076',
       ST_SetSRID(ST_MakePoint(6.9, 46.3), 4326)::geography, l.fiche
FROM (VALUES
  ('ECH_L42', 'Exemple - Ville de Chalon', 'patrimoine', 'patrimoine urbain', true),
  ('ECH_L44', 'Aire de jeux', 'enfants', 'aire de jeux', false),
  ('ECH_L45', 'Exemple - Aire de jeux des Tilleuls', 'enfants', 'aire de jeux', false)
) AS l (id_source, nom, categorie, sous_categorie, fiche);

INSERT INTO lieu_gare (lieu_id, gare_id, distance_m, duree_marche_min)
SELECT l.id, g.id, 200, 3
FROM lieu l, gare g
WHERE l.id_source IN ('ECH_L44', 'ECH_L45') AND g.uic = 'EX000005';

-- D060 : parc animalier classé nature, apparaît aussi sous « enfants » ; un voisin sans secondaire.
INSERT INTO lieu (source, id_source, nom, categorie, sous_categorie, description, code_insee, geom, categories_secondaires)
SELECT 'echantillon', l.id_source, l.nom, 'nature', l.sous_categorie, 'Donnée d''exemple.', '71076',
       ST_SetSRID(ST_MakePoint(6.9, 46.3), 4326)::geography, l.secondaires::text[]
FROM (VALUES
  ('ECH_L47', 'Exemple - Parc animalier', 'parc animalier', '{enfants}'),
  ('ECH_L48', 'Exemple - Sentier des crêtes', 'sentier', '{}')
) AS l (id_source, nom, sous_categorie, secondaires);

INSERT INTO lieu_gare (lieu_id, gare_id, distance_m, duree_marche_min)
SELECT l.id, g.id, 200, 3
FROM lieu l, gare g
WHERE l.id_source IN ('ECH_L47', 'ECH_L48') AND g.uic = 'EX000005';

UPDATE gare_stats SET nb_secondaires = 1
WHERE categorie = 'enfants' AND gare_id = (SELECT id FROM gare WHERE uic = 'EX000006');
INSERT INTO gare_stats (gare_id, categorie, nb_lieux, nb_secondaires)
SELECT id, 'enfants', 0, 1 FROM gare WHERE uic = 'EX000006'
ON CONFLICT (gare_id, categorie) DO UPDATE SET nb_secondaires = 1;

-- D092 : carte de tous les lieux. Loin de toute gare (aucune ligne lieu_gare), sans description :
-- un monument « pauvre » (retiré si la source est triée), un musée (toujours gardé), un monument avec un
-- article Wikipédia (gardé), une aire de jeux non reliée à une gare (jamais sur la carte).
INSERT INTO lieu (source, id_source, nom, categorie, sous_categorie, wikipedia, code_insee, geom)
SELECT 'echantillon', l.id_source, l.nom, l.categorie, l.sous_categorie, l.wikipedia, '71076',
       ST_SetSRID(ST_MakePoint(4.2, 46.5), 4326)::geography
FROM (VALUES
  ('ECH_L49', 'Exemple - Croix de chemin', 'patrimoine', 'monument historique', NULL),
  ('ECH_L50', 'Exemple - Musée du village', 'patrimoine', 'musée', NULL),
  ('ECH_L51', 'Exemple - Château connu', 'patrimoine', 'château', 'https://fr.wikipedia.org/wiki/Exemple'),
  ('ECH_L52', 'Aire de jeux', 'enfants', 'aire de jeux', NULL)
) AS l (id_source, nom, categorie, sous_categorie, wikipedia);

COMMIT;
