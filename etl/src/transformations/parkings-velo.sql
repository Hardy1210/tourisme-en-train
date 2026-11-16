-- Parkings vélo près des gares (docs/04-traitement-donnees.md § 4.7 bis, D097).
-- Entrée : tmp_parking (parkings vélo OSM de la région, remplie par le code), gare.
-- Sortie : mobilite_locale, type PARKING_VELO, une ligne par couple (parking, gare) ; les autres types
-- (bus, tram, car, vélos en libre-service) appartiennent à `transport_local` et ne sont pas touchés.
-- Paramètres : :rayon_m (acces.rayonParkingVeloM, À VOL D'OISEAU : on laisse son vélo devant la gare),
-- :coef_detour (acces.coefDetour, pour que distance_m reste une distance à pied comme les autres lignes).

-- @position
UPDATE tmp_parking SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography;

-- @index
CREATE INDEX ON tmp_parking USING gist (geom);

-- @vider
DELETE FROM mobilite_locale WHERE type = 'PARKING_VELO';

-- @inserer
INSERT INTO mobilite_locale (gare_id, type, nom, lignes, operateur, source, id_source, distance_m, geom)
SELECT g.id, 'PARKING_VELO', p.nom, NULL, NULL, 'osm', p.id_source,
       round(ST_Distance(p.geom, g.geom) * :coef_detour::float8)::int, p.geom
FROM tmp_parking p
JOIN gare g ON g.dans_region AND ST_DWithin(p.geom, g.geom, :rayon_m::float8);
