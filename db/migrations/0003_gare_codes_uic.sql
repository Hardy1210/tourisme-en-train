-- Tous les codes UIC d'une gare (D034, docs/03-base-de-donnees.md § 3.1).
-- Générée par drizzle-kit, complétée à la main : la colonne est remplie (avec `uic`) avant de
-- devenir obligatoire, sinon l'ajout échoue sur une table qui contient déjà des gares.
ALTER TABLE "gare" ADD COLUMN "codes_uic" char(8)[];--> statement-breakpoint
UPDATE "gare" SET "codes_uic" = ARRAY["uic"];--> statement-breakpoint
ALTER TABLE "gare" ALTER COLUMN "codes_uic" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "gare_codes_uic_index" ON "gare" USING gin ("codes_uic");--> statement-breakpoint
ALTER TABLE "gare" ADD CONSTRAINT "gare_uic_dans_codes_uic_check" CHECK ("gare"."uic" = ANY ("gare"."codes_uic"));
