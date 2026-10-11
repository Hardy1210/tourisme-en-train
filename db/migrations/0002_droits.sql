-- Droits des rôles (docs/03-base-de-donnees.md § 4, migration personnalisée).
-- Les rôles et leurs mots de passe sont créés avant les migrations par `pnpm db:migrer` : aucun mot de passe ici (D031).
-- Les ALTER DEFAULT PRIVILEGES couvrent les tables créées plus tard (liaison_directe en E04, tables P1 en E07).
GRANT USAGE ON SCHEMA public TO app_lecture, etl_ecriture;
--> statement-breakpoint
-- app_lecture : lecture seule, même en cas de faille de l'application.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_lecture;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_lecture;
--> statement-breakpoint
-- etl_ecriture : lire et remplacer des lignes ; jamais modifier le schéma (pas propriétaire des tables).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO etl_ecriture;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO etl_ecriture;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO etl_ecriture;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO etl_ecriture;
--> statement-breakpoint
-- Table de référence de PostGIS : lecture seule pour tous.
REVOKE INSERT, UPDATE, DELETE ON spatial_ref_sys FROM etl_ecriture;
--> statement-breakpoint
-- Tables temporaires (chargements en plusieurs temps). Le nom de la base n'est pas écrit en dur : base principale et base de test.
DO $$
BEGIN
  EXECUTE format('GRANT TEMPORARY ON DATABASE %I TO etl_ecriture', current_database());
END
$$;
