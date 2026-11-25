import 'server-only';

import { parametres } from '@/config/parametres';
import { gareParUic, verifierDateDansFenetre } from '@/lib/db/requetes-partagees';
import { Introuvable } from '@/lib/http/erreurs';
import { pageSuivante } from '@/lib/http/pagination';

import type { ParametresLieuxAccessibles, ReponseRangeesLieux } from '../schemas';

import { rangeesDeGares } from './requetes-rangees';
import { lieuResumeDe } from './resume';

/**
 * Onglet Lieux en rangées (D121) : une rangée par gare d'arrivée. Mêmes paramètres que `accessibles`,
 * `page` compte des rangées. `dateDuJour` vient de la route : le service ne lit jamais l'horloge.
 */
export async function rangees(
  { gare, date, categories, dureeMax, page }: ParametresLieuxAccessibles,
  dateDuJour: string,
): Promise<ReponseRangeesLieux> {
  const jour = date ?? dateDuJour;
  await verifierDateDansFenetre(jour);

  const depart = await gareParUic(gare);
  if (depart === null) throw new Introuvable('Cette gare est inconnue.');

  const { lieuxParRangee, rangeesParPage } = parametres.limites;
  const resultat = await rangeesDeGares({
    gareId: depart.id,
    codeInsee: depart.code_insee,
    date: jour,
    dureeMax,
    categories,
    lieuxParRangee,
    rangees: rangeesParPage,
    decalage: (page - 1) * rangeesParPage,
    datePhoto: dateDuJour,
    photosDabord: parametres.photos.enPremier,
  });
  return {
    rangees: resultat.rangees.map((r) => ({
      type: 'gare',
      gare: { uic: r.gare_uic, nom: r.gare_nom },
      dureeTrainMin: r.duree_train_min,
      total: r.total,
      lieux: r.lieux.map(lieuResumeDe),
    })),
    total: resultat.total,
    totalRangees: resultat.total_rangees,
    pageSuivante: pageSuivante(page, rangeesParPage, resultat.total_rangees),
  };
}
