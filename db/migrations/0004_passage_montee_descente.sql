-- Montée et descente interdites à un arrêt (D036, docs/03-base-de-donnees.md § 3.3).
-- Valeur par défaut false : l'ajout fonctionne aussi sur une table déjà remplie.
ALTER TABLE "passage" ADD COLUMN "montee_interdite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "passage" ADD COLUMN "descente_interdite" boolean DEFAULT false NOT NULL;