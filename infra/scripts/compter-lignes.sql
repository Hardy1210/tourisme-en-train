-- Compte les lignes des tables de données, pour comparer le poste et le serveur (infra/README.md).
SELECT
  (SELECT count(*) FROM gare) AS gare,
  (SELECT count(*) FROM lieu) AS lieu,
  (SELECT count(*) FROM lieu_gare) AS lieu_gare,
  (SELECT count(*) FROM liaison_directe) AS liaison_directe,
  (SELECT count(*) FROM trajet) AS trajet,
  (SELECT count(*) FROM passage) AS passage,
  (SELECT count(*) FROM mobilite_locale) AS mobilite_locale;
