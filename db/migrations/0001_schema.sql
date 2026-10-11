CREATE TABLE "categorie_regle" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categorie_regle_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"cle" text NOT NULL,
	"valeur" text NOT NULL,
	"categorie" text,
	"sous_categorie" text,
	"priorite" smallint DEFAULT 100 NOT NULL,
	CONSTRAINT "categorie_regle_source_cle_valeur_unique" UNIQUE("source","cle","valeur"),
	CONSTRAINT "categorie_regle_categorie_check" CHECK ("categorie_regle"."categorie" IN ('enfants', 'nature', 'parcs', 'patrimoine', 'culture'))
);
--> statement-breakpoint
CREATE TABLE "execution_etl" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "execution_etl_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"debut" timestamp with time zone NOT NULL,
	"fin" timestamp with time zone,
	"statut" text NOT NULL,
	"nb_lignes" integer,
	"message" text,
	CONSTRAINT "execution_etl_statut_check" CHECK ("execution_etl"."statut" IN ('EN_COURS', 'SUCCES', 'ECHEC', 'IGNORE'))
);
--> statement-breakpoint
CREATE TABLE "gare" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gare_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uic" char(8) NOT NULL,
	"nom" text NOT NULL,
	"commune" text,
	"code_insee" char(5),
	"departement" char(3),
	"dans_region" boolean DEFAULT false NOT NULL,
	"geom" geography(Point, 4326) NOT NULL,
	"maj" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gare_uic_unique" UNIQUE("uic")
);
--> statement-breakpoint
CREATE TABLE "gare_stats" (
	"gare_id" integer NOT NULL,
	"categorie" text NOT NULL,
	"nb_lieux" integer NOT NULL,
	CONSTRAINT "gare_stats_gare_id_categorie_pk" PRIMARY KEY("gare_id","categorie")
);
--> statement-breakpoint
CREATE TABLE "lieu" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lieu_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"id_source" text NOT NULL,
	"nom" text NOT NULL,
	"categorie" text NOT NULL,
	"sous_categorie" text,
	"description" text,
	"adresse" text,
	"commune" text,
	"code_insee" char(5),
	"url" text,
	"image_url" text,
	"horaires" text,
	"periode" text,
	"qualite_tourisme" boolean DEFAULT false NOT NULL,
	"doublon_de" bigint,
	"geom" geography(Point, 4326) NOT NULL,
	"maj" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lieu_source_id_source_unique" UNIQUE("source","id_source"),
	CONSTRAINT "lieu_categorie_check" CHECK ("lieu"."categorie" IN ('enfants', 'nature', 'parcs', 'patrimoine', 'culture'))
);
--> statement-breakpoint
CREATE TABLE "lieu_gare" (
	"lieu_id" bigint NOT NULL,
	"gare_id" integer NOT NULL,
	"distance_m" integer NOT NULL,
	"duree_marche_min" smallint NOT NULL,
	CONSTRAINT "lieu_gare_lieu_id_gare_id_pk" PRIMARY KEY("lieu_id","gare_id")
);
--> statement-breakpoint
CREATE TABLE "mobilite_locale" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mobilite_locale_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"gare_id" integer NOT NULL,
	"type" text NOT NULL,
	"nom" text NOT NULL,
	"lignes" text[],
	"operateur" text,
	"source" text NOT NULL,
	"id_source" text,
	"distance_m" integer NOT NULL,
	"geom" geography(Point, 4326) NOT NULL,
	CONSTRAINT "mobilite_locale_type_check" CHECK ("mobilite_locale"."type" IN ('BUS', 'TRAM', 'VELO', 'TROTTINETTE', 'AUTRE'))
);
--> statement-breakpoint
CREATE TABLE "passage" (
	"trajet_id" text NOT NULL,
	"sequence" smallint NOT NULL,
	"gare_id" integer NOT NULL,
	"arrivee_s" integer,
	"depart_s" integer,
	CONSTRAINT "passage_trajet_id_sequence_pk" PRIMARY KEY("trajet_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "service_jour" (
	"service_id" text NOT NULL,
	"date_service" date NOT NULL,
	CONSTRAINT "service_jour_service_id_date_service_pk" PRIMARY KEY("service_id","date_service")
);
--> statement-breakpoint
CREATE TABLE "source_donnees" (
	"code" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"producteur" text NOT NULL,
	"url" text NOT NULL,
	"licence" text NOT NULL,
	"attribution" text NOT NULL,
	"date_telechargement" timestamp with time zone,
	"empreinte" text,
	"nb_lignes" integer
);
--> statement-breakpoint
CREATE TABLE "trajet" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"type_train" text NOT NULL,
	"nom_ligne" text,
	"numero" text,
	CONSTRAINT "trajet_type_train_check" CHECK ("trajet"."type_train" IN ('TER', 'INTERCITES', 'TGV', 'AUTRE'))
);
--> statement-breakpoint
ALTER TABLE "gare_stats" ADD CONSTRAINT "gare_stats_gare_id_gare_id_fk" FOREIGN KEY ("gare_id") REFERENCES "public"."gare"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lieu" ADD CONSTRAINT "lieu_source_source_donnees_code_fk" FOREIGN KEY ("source") REFERENCES "public"."source_donnees"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lieu" ADD CONSTRAINT "lieu_doublon_de_lieu_id_fk" FOREIGN KEY ("doublon_de") REFERENCES "public"."lieu"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lieu_gare" ADD CONSTRAINT "lieu_gare_lieu_id_lieu_id_fk" FOREIGN KEY ("lieu_id") REFERENCES "public"."lieu"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lieu_gare" ADD CONSTRAINT "lieu_gare_gare_id_gare_id_fk" FOREIGN KEY ("gare_id") REFERENCES "public"."gare"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobilite_locale" ADD CONSTRAINT "mobilite_locale_gare_id_gare_id_fk" FOREIGN KEY ("gare_id") REFERENCES "public"."gare"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobilite_locale" ADD CONSTRAINT "mobilite_locale_source_source_donnees_code_fk" FOREIGN KEY ("source") REFERENCES "public"."source_donnees"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage" ADD CONSTRAINT "passage_trajet_id_trajet_id_fk" FOREIGN KEY ("trajet_id") REFERENCES "public"."trajet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passage" ADD CONSTRAINT "passage_gare_id_gare_id_fk" FOREIGN KEY ("gare_id") REFERENCES "public"."gare"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gare_geom_index" ON "gare" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "gare_dans_region_index" ON "gare" USING btree ("dans_region");--> statement-breakpoint
CREATE INDEX "lieu_geom_index" ON "lieu" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "lieu_categorie_index" ON "lieu" USING btree ("categorie");--> statement-breakpoint
CREATE INDEX "lieu_nom_trgm_index" ON "lieu" USING gin ("nom" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "lieu_gare_gare_id_distance_m_index" ON "lieu_gare" USING btree ("gare_id","distance_m");--> statement-breakpoint
CREATE INDEX "mobilite_locale_gare_id_distance_m_index" ON "mobilite_locale" USING btree ("gare_id","distance_m");--> statement-breakpoint
CREATE INDEX "passage_gare_id_index" ON "passage" USING btree ("gare_id");--> statement-breakpoint
CREATE INDEX "service_jour_date_service_index" ON "service_jour" USING btree ("date_service");--> statement-breakpoint
CREATE INDEX "trajet_service_id_index" ON "trajet" USING btree ("service_id");