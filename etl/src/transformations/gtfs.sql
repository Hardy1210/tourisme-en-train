-- Transformations du GTFS SNCF (docs/04-traitement-donnees.md § 4.2, D036).
-- Entrée : tables brutes gtfs_* (texte, chargement/gtfs-brut.ts). Sortie : trajet, passage, service_jour.
-- Paramètres : :debut (date du jour à Paris, AAAA-MM-JJ), :jours (fenetreJoursHoraires),
-- :modes_ter, :modes_tgv, :modes_intercites, :modes_exclus (regles/types-train.ts).
-- Une section = une instruction, exécutées dans l'ordre par chargement/gtfs.ts.

-- @fonction_secondes
-- "25:10:00" → 90 600 : secondes depuis minuit, sans limite à 24 h (CLAUDE.md § 3). Illisible → NULL.
CREATE OR REPLACE FUNCTION pg_temp.secondes(h text) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN h ~ '^\s*\d{1,3}:[0-5]\d:[0-5]\d\s*$' THEN
    split_part(trim(h), ':', 1)::int * 3600 + split_part(trim(h), ':', 2)::int * 60
      + split_part(trim(h), ':', 3)::int
  END
$$;

-- @gare_uic
-- Chaque code UIC connu → sa gare (tous les codes d'une gare, D034 ; le code principal d'abord).
CREATE TEMP TABLE tmp_gare_uic ON COMMIT DROP AS
SELECT DISTINCT ON (code) code::text AS uic, g.id AS gare_id, g.dans_region
FROM gare g CROSS JOIN LATERAL unnest(g.codes_uic) AS code
ORDER BY code, (code = g.uic) DESC, g.id;

-- @passage
-- `stop_id` = StopPoint:OCE<mode>-<UIC> : on en tire l'UIC (8 derniers chiffres) et le mode.
CREATE TEMP TABLE tmp_passage ON COMMIT DROP AS
SELECT trip_id,
       stop_sequence::int AS sequence,
       stop_id,
       substring(stop_id FROM '(\d{8})$') AS uic,
       substring(stop_id FROM '^StopPoint:OCE(.*)-\d{8}$') AS mode,
       arrival_time,
       departure_time,
       pg_temp.secondes(arrival_time) AS arrivee_s,
       pg_temp.secondes(departure_time) AS depart_s,
       coalesce(pickup_type, '') = '1' AS montee_interdite,
       coalesce(drop_off_type, '') = '1' AS descente_interdite
FROM gtfs_stop_times;

-- @index_passage
CREATE INDEX ON tmp_passage (trip_id);

-- @service_jour
-- Jours de circulation dans [:debut, :debut + :jours] : calendar.txt déplié (jours de semaine actifs),
-- plus les ajouts (exception_type 1), moins les retraits (2). Dates sans fuseau : le changement
-- d'heure n'a aucun effet (CLAUDE.md § 3).
CREATE TEMP TABLE tmp_service_jour ON COMMIT DROP AS
WITH calendrier AS (
  SELECT c.service_id, jour::date AS date_service
  FROM gtfs_calendar c
  CROSS JOIN LATERAL generate_series(
    greatest(to_date(c.start_date, 'YYYYMMDD'), :debut::date)::timestamp,
    least(to_date(c.end_date, 'YYYYMMDD'), :debut::date + :jours::int)::timestamp,
    interval '1 day') AS jour
  WHERE (ARRAY[c.monday, c.tuesday, c.wednesday, c.thursday, c.friday, c.saturday, c.sunday])
        [extract(isodow FROM jour)::int] = '1'
), exceptions AS (
  SELECT service_id, to_date(date, 'YYYYMMDD') AS date_service, exception_type
  FROM gtfs_calendar_dates
  WHERE to_date(date, 'YYYYMMDD') BETWEEN :debut::date AND :debut::date + :jours::int
)
SELECT service_id, date_service FROM calendrier
UNION
SELECT service_id, date_service FROM exceptions WHERE exception_type = '1'
EXCEPT
SELECT service_id, date_service FROM exceptions WHERE exception_type = '2';

-- @index_service_jour
CREATE INDEX ON tmp_service_jour (service_id);

-- @trajet
-- Mode et type de chaque trajet (un seul mode par trajet, vérifié à l'audit) ; NULL = exclu (car).
CREATE TEMP TABLE tmp_trajet ON COMMIT DROP AS
SELECT p.trip_id,
       min(p.mode) AS mode,
       count(DISTINCT p.mode) AS nb_modes,
       CASE
         WHEN min(p.mode) = ANY(:modes_exclus::text[]) THEN NULL
         WHEN min(p.mode) = ANY(:modes_ter::text[]) THEN 'TER'
         WHEN min(p.mode) = ANY(:modes_tgv::text[]) THEN 'TGV'
         WHEN min(p.mode) = ANY(:modes_intercites::text[]) THEN 'INTERCITES'
         ELSE 'AUTRE'
       END AS type_train,
       coalesce(bool_or(g.dans_region), false) AS dans_region
FROM tmp_passage p
LEFT JOIN tmp_gare_uic g USING (uic)
GROUP BY p.trip_id;

-- @trajet_retenu
-- Trains (pas les cars) qui s'arrêtent dans la région ET circulent au moins un jour de la fenêtre.
CREATE TEMP TABLE tmp_trajet_retenu ON COMMIT DROP AS
SELECT t.trip_id, tr.service_id, t.type_train, r.route_short_name, tr.trip_headsign
FROM tmp_trajet t
JOIN gtfs_trips tr USING (trip_id)
LEFT JOIN gtfs_routes r USING (route_id)
WHERE t.type_train IS NOT NULL
  AND t.dans_region
  AND EXISTS (SELECT 1 FROM tmp_service_jour s WHERE s.service_id = tr.service_id);

-- @index_trajet_retenu
CREATE UNIQUE INDEX ON tmp_trajet_retenu (trip_id);

-- @analyser
-- Les tables temporaires ne sont jamais analysées automatiquement : sans statistiques, plans lents.
ANALYZE tmp_passage, tmp_service_jour, tmp_trajet, tmp_trajet_retenu, tmp_gare_uic;

-- @vider
-- Remplacement complet (04 § 1, principe 5) : `passage` suit `trajet` (ON DELETE CASCADE).
DELETE FROM trajet;

-- @vider_service_jour
DELETE FROM service_jour;

-- @inserer_trajet
INSERT INTO trajet (id, service_id, type_train, nom_ligne, numero)
SELECT trip_id, service_id, type_train, nullif(route_short_name, ''), nullif(trip_headsign, '')
FROM tmp_trajet_retenu;

-- @inserer_passage
-- Seuls les arrêts rapprochés d'une gare (les gares étrangères sont comptées dans le rapport).
INSERT INTO passage (trajet_id, sequence, gare_id, arrivee_s, depart_s,
                     montee_interdite, descente_interdite)
SELECT p.trip_id, p.sequence, g.gare_id, p.arrivee_s, p.depart_s,
       p.montee_interdite, p.descente_interdite
FROM tmp_passage p
JOIN tmp_trajet_retenu USING (trip_id)
JOIN tmp_gare_uic g USING (uic);

-- @inserer_service_jour
INSERT INTO service_jour (service_id, date_service)
SELECT DISTINCT s.service_id, s.date_service
FROM tmp_service_jour s
WHERE s.service_id IN (SELECT service_id FROM tmp_trajet_retenu);
