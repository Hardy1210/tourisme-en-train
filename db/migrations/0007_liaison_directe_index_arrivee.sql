-- Index des liaisons par gare d'arrivée (D040) : sans lui, protéger ou supprimer une gare au chargement
-- parcourt toute la table pour chaque gare (60 s au lieu de 4 s le 01/11).
CREATE INDEX "liaison_directe_gare_arrivee_id_index" ON "liaison_directe" USING btree ("gare_arrivee_id");