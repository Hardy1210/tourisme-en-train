# GTFS miniature — DONNÉES D'EXEMPLE, PAS DE VRAIES DONNÉES

Construit à la main pour les tests de E03 (`etl/tests/gtfs.integration.test.ts`), au format du
GTFS SNCF (`StopPoint:OCE<mode>-<UIC>`). Les gares `8700001x` sont fictives et créées par le test.

| Trajet | Mode | Cas testé |
|---|---|---|
| `T_TER` | Train TER | calendrier lundi → vendredi (`calendar.txt`) du 19/10 au 08/11, traversant le changement d'heure du 25/10 ; exception 2 retire le mardi 27/10, exception 1 ajoute le dimanche 25/10 ; pas de descente au départ, pas de montée à l'arrivée |
| `T_NUIT` | INTERCITES de nuit | passages après minuit : `25:10:00` → 90 600 s |
| `T_TGV` | TGV INOUI | montée interdite à un arrêt intermédiaire ; arrêt à Bâle (gare étrangère, non rapprochée) |
| `T_AUTRE` | Train | mode inconnu → type `AUTRE` |
| `T_CAR` | Car TER | exclu (pas un train) |
| `T_HORS` | Train TER | ne touche pas la région → non chargé |
