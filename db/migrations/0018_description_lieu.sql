CREATE TABLE "description_lieu" (
	"lieu_id" bigint NOT NULL,
	"origine" text NOT NULL,
	"texte" text NOT NULL,
	"credit" text NOT NULL,
	"licence" text,
	"lien" text,
	"maj" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "description_lieu_lieu_id_origine_pk" PRIMARY KEY("lieu_id","origine"),
	CONSTRAINT "description_lieu_origine_check" CHECK ("description_lieu"."origine" IN ('wikipedia', 'wagoo')),
	CONSTRAINT "description_lieu_texte_check" CHECK (btrim("description_lieu"."texte") <> ''),
	CONSTRAINT "description_lieu_credit_check" CHECK (btrim("description_lieu"."credit") <> '')
);
--> statement-breakpoint
ALTER TABLE "description_lieu" ADD CONSTRAINT "description_lieu_lieu_id_lieu_id_fk" FOREIGN KEY ("lieu_id") REFERENCES "public"."lieu"("id") ON DELETE cascade ON UPDATE no action;