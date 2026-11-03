// En-tête de la fiche destination (docs/05-api.md § 3.5, D049, D051) : mêmes valeurs que la carte.
import 'server-only';
import { type Maintenant } from '@tourisme/commun';

import { parametres } from '@/config/parametres';
import { gareParUic, verifierDateDansFenetre } from '@/lib/db/requetes-partagees';
import { heure, heureOuNull } from '@/lib/dates/heures';
import { trancheTemps } from '@/lib/dates/tranche-temps';
import { Introuvable } from '@/lib/http/erreurs';
import { impactLiaison } from '@/lib/impact/impact';

import type { FicheDestination, ParametresFiche } from '../schemas';

import { estHorsVille, titreDestination } from './regrouper';
import { liaisonEntre, lieuxParCategorie } from './requetes';

export async function ficheDestination(
  uic: string,
  { depuis, date }: ParametresFiche,
  maintenant: Maintenant,
): Promise<FicheDestination> {
  const gare = await gareParUic(uic);
  if (gare === null) throw new Introuvable('Cette gare est inconnue.');
  const horsVille = estHorsVille(gare.nom, parametres.destinations.motGareHorsVille);

  let liaison: FicheDestination['liaison'] = null;
  if (depuis !== undefined) {
    const jour = date ?? maintenant.dateDuJour;
    await verifierDateDansFenetre(jour);
    const depart = await gareParUic(depuis);
    if (depart === null) throw new Introuvable('La gare de départ est inconnue.');
    const brute = await liaisonEntre(depart.id, gare.id, jour);
    if (brute !== null) {
      const impact = impactLiaison(brute.distance_km, brute.types_train);
      liaison = {
        date: jour,
        dureeMin: brute.duree_min,
        trancheTemps: trancheTemps(brute.duree_min),
        nbTrains: brute.nb_trains,
        premierDepart: heure(brute.premier_depart_s),
        dernierRetour: heureOuNull(brute.dernier_retour_s),
        typesTrain: brute.types_train,
        distanceKm: brute.distance_km,
        faisableJournee: brute.faisable_journee,
        co2EconomiseKg: impact.co2EconomiseKg,
        prixEstime: impact.prixEstime,
      };
    }
  }

  return {
    gare: {
      uic: gare.uic,
      nom: gare.nom,
      lat: gare.lat,
      lon: gare.lon,
      dansRegion: gare.dans_region,
      titre: titreDestination(gare.nom, gare.commune, horsVille),
      commune: { nom: gare.commune, codeInsee: gare.code_insee },
      horsVille,
    },
    lieuxParCategorie: gare.dans_region ? await lieuxParCategorie(gare.id) : {},
    lieuxCharges: gare.dans_region,
    liaison,
  };
}
