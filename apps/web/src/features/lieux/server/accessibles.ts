import 'server-only';

import { parametres } from '@/config/parametres';
import { gareParUic, verifierDateDansFenetre } from '@/lib/db/requetes-partagees';
import { Introuvable } from '@/lib/http/erreurs';
import { pageSuivante } from '@/lib/http/pagination';

import type { ParametresLieuxAccessibles, ReponseLieuxAccessibles } from '../schemas';

import { lieuxAccessibles } from './requetes-accessibles';

/** Onglet Lieux (D056). `dateDuJour` vient de la route : le service ne lit jamais l'horloge. */
export async function accessibles(
  { gare, date, categories, dureeMax, page }: ParametresLieuxAccessibles,
  dateDuJour: string,
): Promise<ReponseLieuxAccessibles> {
  const jour = date ?? dateDuJour;
  await verifierDateDansFenetre(jour);

  const depart = await gareParUic(gare);
  if (depart === null) throw new Introuvable('Cette gare est inconnue.');

  const limite = parametres.limites.lieuxParPage;
  const { total, lieux } = await lieuxAccessibles({
    gareId: depart.id,
    codeInsee: depart.code_insee,
    date: jour,
    dureeMax,
    categories,
    limite,
    decalage: (page - 1) * limite,
  });
  return {
    lieux: lieux.map((l) => ({
      cle: l.cle,
      nom: l.nom,
      categorie: l.categorie,
      sousCategorie: l.sous_categorie,
      distanceM: l.distance_m,
      dureeMarcheMin: l.duree_marche_min,
      imageUrl: l.image_url,
      qualiteTourisme: l.qualite_tourisme,
      source: l.source,
      lat: l.lat,
      lon: l.lon,
      gare: { uic: l.gare_uic, nom: l.gare_nom },
      dureeTrainMin: l.duree_train_min,
    })),
    total,
    pageSuivante: pageSuivante(page, limite, total),
  };
}
