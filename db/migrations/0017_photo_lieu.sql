CREATE TABLE "photo_lieu" (
	"lieu_id" bigint PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"origine" text NOT NULL,
	"fichier" text NOT NULL,
	"url_petite" text NOT NULL,
	"url_grande" text NOT NULL,
	"auteur" text NOT NULL,
	"licence" text NOT NULL,
	"licence_url" text,
	"page" text,
	"droits_debut" date,
	"droits_fin" date,
	"maj" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photo_lieu_origine_check" CHECK ("photo_lieu"."origine" IN ('osm', 'wikipedia', 'wikidata', 'datatourisme')),
	CONSTRAINT "photo_lieu_auteur_check" CHECK (btrim("photo_lieu"."auteur") <> ''),
	CONSTRAINT "photo_lieu_licence_check" CHECK (btrim("photo_lieu"."licence") <> ''),
	CONSTRAINT "photo_lieu_droits_check" CHECK ("photo_lieu"."droits_debut" IS NULL OR "photo_lieu"."droits_fin" IS NULL OR "photo_lieu"."droits_debut" <= "photo_lieu"."droits_fin")
);
--> statement-breakpoint
ALTER TABLE "lieu" ADD COLUMN "wikidata" text;--> statement-breakpoint
ALTER TABLE "photo_lieu" ADD CONSTRAINT "photo_lieu_lieu_id_lieu_id_fk" FOREIGN KEY ("lieu_id") REFERENCES "public"."lieu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_lieu" ADD CONSTRAINT "photo_lieu_source_source_donnees_code_fk" FOREIGN KEY ("source") REFERENCES "public"."source_donnees"("code") ON DELETE no action ON UPDATE no action;