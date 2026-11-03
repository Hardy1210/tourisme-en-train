// Trains directs aller et retour (docs/05-api.md § 3.8, D040, D051).
import 'server-only';
import { type Maintenant } from '@tourisme/commun';

import { parametres } from '@/config/parametres';
import { gareParUic, verifierDateDansFenetre } from '@/lib/db/requetes-partagees';
import { heure } from '@/lib/dates/heures';
import { Introuvable } from '@/lib/http/erreurs';

import type { ParametresTrains, ReponseTrains, Train } from '../schemas';

import { type TrainBrut, trainsDirects } from './requetes';

const versTrain = (t: TrainBrut): Train => ({
  trajetIds: t.trajet_ids,
  depart: heure(t.depart_s),
  arrivee: heure(t.arrivee_s),
  dureeMin: Math.round((t.arrivee_s - t.depart_s) / 60),
  typeTrain: t.type_train,
  numeros: t.numeros,
});

/** `maintenant` vient de `maintenantParis()` (route) : le service ne lit jamais l'horloge. */
export async function trains(
  { depart, arrivee, date, depuis }: ParametresTrains,
  maintenant: Maintenant,
): Promise<ReponseTrains> {
  const jour = date ?? maintenant.dateDuJour;
  await verifierDateDansFenetre(jour);
  const [gareDepart, gareArrivee] = await Promise.all([gareParUic(depart), gareParUic(arrivee)]);
  if (gareDepart === null || gareArrivee === null)
    throw new Introuvable('Cette gare est inconnue.');

  const depuisS = depuis ?? (jour === maintenant.dateDuJour ? maintenant.heureActuelleS : 0);
  const limite = parametres.limites.trains;
  const [aller, retour] = await Promise.all([
    trainsDirects(gareDepart.id, gareArrivee.id, jour),
    trainsDirects(gareArrivee.id, gareDepart.id, jour),
  ]);
  const allers = aller.filter((t) => t.depart_s >= depuisS).slice(0, limite);
  // Retours utiles : ceux qui partent après l'arrivée du premier aller proposé (D051, règle de Hardy) ;
  // sans aller, aucun retour à proposer. Le dernier retour du jour reste toujours indiqué.
  const premiereArrivee = allers[0]?.arrivee_s;
  const retours =
    premiereArrivee === undefined ? [] : retour.filter((t) => t.depart_s > premiereArrivee);
  const dernier = retour.at(-1);
  return {
    date: jour,
    aller: allers.map(versTrain),
    retour: retours.slice(0, limite).map(versTrain),
    dernierRetour: dernier ? versTrain(dernier) : null,
  };
}
