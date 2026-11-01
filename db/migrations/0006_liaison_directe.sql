-- Liaisons directes entre gares, calculées par `pnpm etl liaisons` (D040, docs/03-base-de-donnees.md § 3.5).
-- Droits : couverts par les ALTER DEFAULT PRIVILEGES de 0002_droits.
CREATE TABLE "liaison_directe" (
	"gare_depart_id" integer NOT NULL,
	"gare_arrivee_id" integer NOT NULL,
	"date_service" date NOT NULL,
	"duree_min" smallint NOT NULL,
	"nb_trains" smallint NOT NULL,
	"premier_depart_s" integer NOT NULL,
	"dernier_depart_s" integer NOT NULL,
	"premiere_arrivee_s" integer NOT NULL,
	"types_train" text[] NOT NULL,
	"distance_km" numeric(6, 1) NOT NULL,
	"faisable_journee" boolean NOT NULL,
	CONSTRAINT "liaison_directe_gare_depart_id_gare_arrivee_id_date_service_pk" PRIMARY KEY("gare_depart_id","gare_arrivee_id","date_service"),
	CONSTRAINT "liaison_directe_gares_distinctes_check" CHECK ("liaison_directe"."gare_depart_id" <> "liaison_directe"."gare_arrivee_id"),
	CONSTRAINT "liaison_directe_duree_min_check" CHECK ("liaison_directe"."duree_min" > 0),
	CONSTRAINT "liaison_directe_nb_trains_check" CHECK ("liaison_directe"."nb_trains" > 0)
);
--> statement-breakpoint
ALTER TABLE "liaison_directe" ADD CONSTRAINT "liaison_directe_gare_depart_id_gare_id_fk" FOREIGN KEY ("gare_depart_id") REFERENCES "public"."gare"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liaison_directe" ADD CONSTRAINT "liaison_directe_gare_arrivee_id_gare_id_fk" FOREIGN KEY ("gare_arrivee_id") REFERENCES "public"."gare"("id") ON DELETE no action ON UPDATE no action;