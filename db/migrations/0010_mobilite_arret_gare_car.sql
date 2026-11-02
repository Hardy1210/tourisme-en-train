-- E07, D046 : type CAR (cars régionaux Mobigo) ; une ligne par couple (arrêt, gare) dans mobilite_locale.
ALTER TABLE "mobilite_locale" DROP CONSTRAINT "mobilite_locale_type_check";--> statement-breakpoint
ALTER TABLE "mobilite_locale" ADD CONSTRAINT "mobilite_locale_gare_source_id_unique" UNIQUE("gare_id","source","id_source");--> statement-breakpoint
ALTER TABLE "mobilite_locale" ADD CONSTRAINT "mobilite_locale_type_check" CHECK ("mobilite_locale"."type" IN ('BUS', 'TRAM', 'CAR', 'VELO', 'TROTTINETTE', 'AUTRE'));