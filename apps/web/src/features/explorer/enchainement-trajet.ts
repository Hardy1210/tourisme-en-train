// Page « Trajet » du téléphone (D085) : après un choix dans la liste, passer à l'autre champ ou fermer.
// Fonction pure.

export type ChampTrajet = 'depart' | 'destination';

type Etat = {
  /** Le champ où le choix vient d'être fait. */
  champ: ChampTrajet;
  /** Départ connu (position acceptée ou gare choisie). */
  departRempli: boolean;
  /** Une destination est déjà choisie ou cherchée. */
  destinationRemplie: boolean;
};

export type Suite = { action: 'champ'; champ: ChampTrajet } | { action: 'fermer' };

/** L'autre champ est vide : le curseur y passe, la page reste ouverte. Les deux remplis : fermer. */
export function apresChoix({ champ, departRempli, destinationRemplie }: Etat): Suite {
  if (champ === 'depart' && !destinationRemplie) return { action: 'champ', champ: 'destination' };
  if (champ === 'destination' && !departRempli) return { action: 'champ', champ: 'depart' };
  return { action: 'fermer' };
}
