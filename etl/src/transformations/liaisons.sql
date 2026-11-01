-- Liaisons directes entre gares (docs/04-traitement-donnees.md § 4.3, D040).
-- Entrée : gare, passage, trajet, service_jour (E03). Sortie : liaison_directe.
-- Paramètres : :debut (date du jour à Paris, AAAA-MM-JJ), :jours (fenetreJoursLiaisons),
-- :coef_detour (rail.coefDetour), :arrivee_max_s (journee.arriveeMaxAller en secondes),
-- :visite_s (journee.dureeVisiteMin en secondes).
-- Une section = une instruction, exécutées dans l'ordre par chargement/liaisons.ts.

-- @paire
-- Paires (montée en A, descente plus loin en B) d'un même trajet, indépendantes de la date.
-- Départ OU arrivée dans la région : les deux sens existent, donc les retours aussi (D040).
CREATE TEMP TABLE tmp_paire ON COMMIT DROP AS
SELECT a.trajet_id, a.gare_id AS dep, b.gare_id AS arr, a.depart_s, b.arrivee_s
FROM passage a
JOIN passage b ON b.trajet_id = a.trajet_id AND b.sequence > a.sequence
JOIN gare gd ON gd.id = a.gare_id
JOIN gare ga ON ga.id = b.gare_id
WHERE a.depart_s IS NOT NULL AND b.arrivee_s IS NOT NULL AND a.gare_id <> b.gare_id
  AND NOT a.montee_interdite AND NOT b.descente_interdite
  AND (gd.dans_region OR ga.dans_region);

-- @liaison
-- Une ligne par (départ, arrivée, date de service). Trains en jumelage (mêmes heures de départ et
-- d'arrivée, deux trajets) comptés une seule fois.
CREATE TEMP TABLE tmp_liaison ON COMMIT DROP AS
SELECT p.dep, p.arr, s.date_service,
       min((p.arrivee_s - p.depart_s) / 60) AS duree_min,
       count(DISTINCT (p.depart_s, p.arrivee_s)) AS nb_trains,
       count(*) - count(DISTINCT (p.depart_s, p.arrivee_s)) AS nb_jumeaux,
       min(p.depart_s) AS premier_depart_s,
       max(p.depart_s) AS dernier_depart_s,
       min(p.arrivee_s) AS premiere_arrivee_s,
       array_agg(DISTINCT t.type_train ORDER BY t.type_train) AS types_train
FROM tmp_paire p
JOIN trajet t ON t.id = p.trajet_id
JOIN service_jour s ON s.service_id = t.service_id
WHERE s.date_service BETWEEN :debut::date AND :debut::date + :jours::int
GROUP BY p.dep, p.arr, s.date_service;

-- @index_liaison
-- Lecture de la liaison inverse (retour) à l'insertion.
CREATE INDEX ON tmp_liaison (dep, arr, date_service);

-- @analyser
ANALYZE tmp_liaison;

-- @vider
DELETE FROM liaison_directe;

-- @inserer
-- Liaison inverse r = le retour, même date : son dernier départ est le dernier retour.
INSERT INTO liaison_directe (gare_depart_id, gare_arrivee_id, date_service, duree_min, nb_trains,
  premier_depart_s, dernier_depart_s, premiere_arrivee_s, types_train, distance_km, faisable_journee)
SELECT l.dep, l.arr, l.date_service, l.duree_min, l.nb_trains,
       l.premier_depart_s, l.dernier_depart_s, l.premiere_arrivee_s, l.types_train,
       round((ST_Distance(gd.geom, ga.geom) / 1000 * :coef_detour::float8)::numeric, 1),
       coalesce(l.premiere_arrivee_s <= :arrivee_max_s::int
                AND r.dernier_depart_s >= l.premiere_arrivee_s + :visite_s::int, false)
FROM tmp_liaison l
JOIN gare gd ON gd.id = l.dep
JOIN gare ga ON ga.id = l.arr
LEFT JOIN tmp_liaison r ON r.dep = l.arr AND r.arr = l.dep AND r.date_service = l.date_service;
