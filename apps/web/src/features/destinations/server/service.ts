// Destinations en train direct depuis une gare (docs/05-api.md § 3.4, D040, D047).
import 'server-only';
import { type Maintenant } from '@tourisme/commun';

import { parametres } from '@/config/parametres';
import { fenetreLiaisons } from '@/lib/db/requetes-partagees';
import { secondesVersHeure } from '@/lib/dates/heures';
import { trancheTemps } from '@/lib/dates/tranche-temps';
import { Introuvable, ParametreInvalide } from '@/lib/http/erreurs';
import { impactLiaison } from '@/lib/impact/impact';

import type { Destination, Heure, ParametresDestinations, ReponseDestinations } from '../schemas';

import { type GareAtteinteBrute, gareDepart, garesAtteintes, prochainsTrains } from './requetes';
import { regrouperParVille } from './regrouper';

const heure = (s: number): Heure => ({ s, ...secondesVersHeure(s) });
const heureOuNull = (s: number | null | undefined): Heure | null =>
  s === null || s === undefined ? null : heure(s);

const enFrancais = (date: string): string => date.split('-').reverse().join('/');

/** `maintenant` vient de `maintenantParis()` (route) : le service ne lit jamais l'horloge. */
export async function destinations(
  { gare, date, categories, dureeMax }: ParametresDestinations,
  maintenant: Maintenant,
): Promise<ReponseDestinations> {
  const jour = date ?? maintenant.dateDuJour;
  const fenetre = await fenetreLiaisons();
  if (fenetre === null || jour < fenetre.debut || jour > fenetre.fin) {
    throw new ParametreInvalide(
      fenetre === null
        ? 'Aucun horaire n’est chargé pour le moment.'
        : `Les horaires sont disponibles du ${enFrancais(fenetre.debut)} au ${enFrancais(fenetre.fin)}.`,
    );
  }

  const depart = await gareDepart(gare);
  if (depart === null) throw new Introuvable('Cette gare est inconnue.');

  const lignes = await garesAtteintes({ gareId: gare, date: jour, dureeMax, categories });
  const regroupements = regrouperParVille(
    lignes.map((l) => ({
      ...l,
      gareId: l.gare_id,
      cleVille: l.cle_ville,
      dansRegion: l.dans_region,
      dureeMin: l.duree_min,
      nbTrains: l.nb_trains,
      nbLieux: Object.values(l.lieux).reduce((somme, n) => somme + (n ?? 0), 0),
    })),
    {
      cleVilleDepart: depart.cle_ville,
      filtreEnvies: categories !== null,
      limite: parametres.limites.destinations,
    },
  );

  // Aujourd'hui : à partir de l'heure actuelle ; un autre jour : dès le premier train.
  const prochains = await prochainsTrains({
    gareId: gare,
    date: jour,
    arriveeIds: regroupements.map((r) => r.tete.gare_id),
    depuisS: jour === maintenant.dateDuJour ? maintenant.heureActuelleS : 0,
  });
  const prochainPar = new Map(prochains.map((p) => [p.gare_id, p]));

  return {
    gareDepart: { id: depart.id, nom: depart.nom },
    date: jour,
    destinations: regroupements.map(({ tete, autres, sansLieu }) =>
      versDestination(tete, autres, sansLieu, prochainPar.get(tete.gare_id)),
    ),
  };
}

function versDestination(
  tete: GareAtteinteBrute,
  autres: readonly GareAtteinteBrute[],
  sansLieu: boolean,
  prochain: { depart_s: number; arrivee_s: number } | undefined,
): Destination {
  const impact = impactLiaison(tete.distance_km, tete.types_train);
  return {
    ville: { nom: tete.ville, codeInsee: tete.code_insee },
    gare: {
      id: tete.gare_id,
      nom: tete.nom,
      lat: tete.lat,
      lon: tete.lon,
      dansRegion: tete.dans_region,
    },
    autresGares: autres.map((g) => ({
      id: g.gare_id,
      nom: g.nom,
      dureeMin: g.duree_min,
      nbTrains: g.nb_trains,
    })),
    dureeMin: tete.duree_min,
    trancheTemps: trancheTemps(tete.duree_min),
    nbTrains: tete.nb_trains,
    premierDepart: heure(tete.premier_depart_s),
    dernierRetour: heureOuNull(tete.dernier_retour_s),
    prochainDepart: heureOuNull(prochain?.depart_s),
    prochaineArrivee: heureOuNull(prochain?.arrivee_s),
    typesTrain: tete.types_train,
    distanceKm: tete.distance_km,
    lieuxParCategorie: tete.lieux,
    sansLieu,
    faisableJournee: tete.faisable_journee,
    lieuxCharges: tete.dans_region,
    co2EconomiseKg: impact.co2EconomiseKg,
    prixEstime: impact.prixEstime,
  };
}
