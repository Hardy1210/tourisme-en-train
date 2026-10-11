-- Extensions (migration personnalisée, D033). IF NOT EXISTS : l'image postgis/postgis crée déjà
-- l'extension postgis dans la base principale, mais pas dans une base créée ensuite (base de test).
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
-- Similarité de noms (index trigramme sur lieu.nom, détection des doublons).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
