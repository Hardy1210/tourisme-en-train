-- Table `commune` (D038, docs/03-base-de-donnees.md § 3.1 bis) : le nom et le département quittent `gare`.
-- Générée par drizzle-kit, complétée à la main : les communes déjà connues des gares sont recopiées
-- AVANT d'ajouter la clé étrangère, sinon elle échoue sur une base qui contient déjà des gares. Une
-- gare sans nom de commune (code absent du COG) perd son code INSEE. `pnpm etl communes` complète la table.
CREATE TABLE "commune" (
	"code_insee" char(5) PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"departement" char(3) NOT NULL
);
--> statement-breakpoint
INSERT INTO "commune" ("code_insee", "nom", "departement")
SELECT DISTINCT ON ("code_insee") "code_insee", "commune", "departement"
FROM "gare"
WHERE "code_insee" IS NOT NULL AND "commune" IS NOT NULL AND "departement" IS NOT NULL
ORDER BY "code_insee";--> statement-breakpoint
UPDATE "gare" SET "code_insee" = NULL
WHERE "code_insee" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "commune" c WHERE c."code_insee" = "gare"."code_insee");--> statement-breakpoint
ALTER TABLE "gare" ADD CONSTRAINT "gare_code_insee_commune_code_insee_fk" FOREIGN KEY ("code_insee") REFERENCES "public"."commune"("code_insee") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gare_code_insee_index" ON "gare" USING btree ("code_insee");--> statement-breakpoint
ALTER TABLE "gare" DROP COLUMN "commune";--> statement-breakpoint
ALTER TABLE "gare" DROP COLUMN "departement";--> statement-breakpoint
-- Empreinte oubliée : sinon `pnpm etl communes` répondrait IGNORE (même fichier) et la table resterait partielle.
UPDATE "source_donnees" SET "empreinte" = NULL WHERE "code" = 'communes';
