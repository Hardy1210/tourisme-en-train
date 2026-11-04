// Mise en forme des trains : calculs purs, sans lecture de l'horloge.
import type { Train } from './schemas';

/** « 10:12 », ou « 00:35 (+1) » après minuit (`06` § 9). */
export function formaterHeure(heure: { texte: string; lendemain: boolean }): string {
  return heure.lendemain ? `${heure.texte} (+1)` : heure.texte;
}

/** « TER 17818 », « TGV 12177 / 5537 » (trains en jumelage, D040), « TER » sans numéro connu. */
export function libelleTrain(train: Pick<Train, 'typeTrain' | 'numeros'>): string {
  const type = train.typeTrain === 'INTERCITES' ? 'Intercités' : train.typeTrain;
  return train.numeros.length > 0 ? `${type} ${train.numeros.join(' / ')}` : type;
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
