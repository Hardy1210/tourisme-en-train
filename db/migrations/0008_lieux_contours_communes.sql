-- E05, D041 : contour des communes de la région (commune.contour), commune d'un lieu par clé
-- étrangère (lieu.commune en texte supprimée), condition des règles de catégorie OSM,
-- doublon_de remis à nul quand le lieu visé est supprimé au rechargement de sa source.
ALTER TABLE "lieu" DROP CONSTRAINT "lieu_doublon_de_lieu_id_fk";
--> statement-breakpoint
ALTER TABLE "categorie_regle" ADD COLUMN "condition" text;--> statement-breakpoint
ALTER TABLE "commune" ADD COLUMN "contour" geography(MultiPolygon, 4326);--> statement-breakpoint
ALTER TABLE "lieu" ADD CONSTRAINT "lieu_code_insee_commune_code_insee_fk" FOREIGN KEY ("code_insee") REFERENCES "public"."commune"("code_insee") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lieu" ADD CONSTRAINT "lieu_doublon_de_lieu_id_fk" FOREIGN KEY ("doublon_de") REFERENCES "public"."lieu"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commune_contour_index" ON "commune" USING gist ("contour");--> statement-breakpoint
ALTER TABLE "lieu" DROP COLUMN "commune";--> statement-breakpoint
ALTER TABLE "categorie_regle" ADD CONSTRAINT "categorie_regle_condition_check" CHECK ("categorie_regle"."condition" IN ('sans_nom', 'notable'));