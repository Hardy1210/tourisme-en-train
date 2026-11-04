ALTER TABLE "gare_stats" ADD COLUMN "nb_secondaires" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lieu" ADD COLUMN "categories_secondaires" text[] DEFAULT '{}'::text[] NOT NULL;