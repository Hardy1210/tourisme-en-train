// Mise en forme des trains : calculs purs, sans lecture de l'horloge.
import { parametres } from '@/config/parametres';
import { trainParti } from '@/lib/dates/heures';
import type { ReponseTrains, Train } from './schemas';

/** « 10:12 », ou « 00:35 (+1) » après minuit (`06` § 9). */
export function formaterHeure(heure: { texte: string; lendemain: boolean }): string {
  return heure.lendemain ? `${heure.texte} (+1)` : heure.texte;
}

/**
 * « TER Mobigo 17818 », « TGV 12177 / 5537 » (trains en jumelage, D040), « TER » sans numéro connu.
 * Nom régional (`region.nomTer`) seulement si les deux terminus du train sont dans la région : afficher
 * « TER » n'est jamais faux, le nom d'une autre région l'est (D082).
 */
export function libelleTrain(
  train: Pick<Train, 'typeTrain' | 'numeros' | 'terminusEnRegion'>,
  nomTer: string = parametres.region.nomTer,
): string {
  const type =
    train.typeTrain === 'INTERCITES'
      ? 'Intercités'
      : train.typeTrain === 'TER' && train.terminusEnRegion
        ? nomTer
        : train.typeTrain;
  return train.numeros.length > 0 ? `${type} ${train.numeros.join(' / ')}` : type;
}

/** Retire les trains déjà partis, quel que soit l'âge de la réponse (cache, D068). */
export function trainsAVenir(
  reponse: ReponseTrains,
  maintenant: { dateDuJour: string; heureActuelleS: number },
): ReponseTrains {
  const aVenir = (train: Train) => !trainParti(train.depart.s, reponse.date, maintenant);
  return {
    ...reponse,
    aller: reponse.aller.filter(aVenir),
    retour: reponse.retour.filter(aVenir),
    dernierRetour:
      reponse.dernierRetour && aVenir(reponse.dernierRetour) ? reponse.dernierRetour : null,
  };
}

export type LigneRetour = { train: Train; dernier: boolean };

/** Les retours à afficher : le dernier du jour est marqué, et ajouté s'il dépasse la limite de la liste. */
export function lignesRetour(retour: readonly Train[], dernier: Train | null): LigneRetour[] {
  const cle = dernier?.trajetIds[0];
  const lignes = retour.map((train) => ({ train, dernier: train.trajetIds[0] === cle }));
  if (dernier && retour.length > 0 && !lignes.some((l) => l.dernier)) {
    lignes.push({ train: dernier, dernier: true });
  }
  return lignes;
}
