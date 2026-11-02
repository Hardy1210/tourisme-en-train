-- E06, D043 : représentant de site (lieu.site_de), tracé des lieux en longueur (lieu.trace),
-- noms comparés sans accents pour les doublons (extension unaccent).
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
ALTER TABLE "lieu" ADD COLUMN "site_de" bigint;--> statement-breakpoint
ALTER TABLE "lieu" ADD COLUMN "trace" geography(MultiLineString, 4326);--> statement-breakpoint
ALTER TABLE "lieu" ADD CONSTRAINT "lieu_site_de_lieu_id_fk" FOREIGN KEY ("site_de") REFERENCES "public"."lieu"("id") ON DELETE set null ON UPDATE no action;