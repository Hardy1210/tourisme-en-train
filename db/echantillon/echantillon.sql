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

-- 10 gares : 9 dans la région, Lyon-Part-Dieu hors région.
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
INSERT INTO lieu (source, id_source, nom, categorie, sous_categorie, description, commune, code_insee, geom)
SELECT 'echantillon', l.id_source, l.nom, l.categorie, l.sous_categorie, 'Donnée d''exemple.',
       l.commune, l.insee, ST_SetSRID(ST_MakePoint(l.lon, l.lat), 4326)::geography
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

COMMIT;
