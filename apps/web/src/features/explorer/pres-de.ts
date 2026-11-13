// Section « Près de… » d'Explorer (maquette v6) : autour de qui, où dans la liste, avec quel titre.

export type SectionPresDe =
  | { autour: 'depart'; emplacement: 'haut'; titre: string }
  | { autour: 'destination'; emplacement: 'bas'; titre: string; uic: string };

/**
 * Sans destination choisie : en haut, autour de l'utilisateur (position) ou de la gare de départ choisie.
 * Destination choisie : en bas, après la liste, autour de sa gare d'arrivée (périmètre à pied des gares).
 */
export function sectionPresDe(options: {
  origine: 'position' | 'choix';
  gareDepart: string;
  destination: { uic: string; gare: string } | null;
}): SectionPresDe {
  const { origine, gareDepart, destination } = options;
  if (destination !== null) {
    return {
      autour: 'destination',
      emplacement: 'bas',
      titre: `Près de la gare de ${destination.gare}`,
      uic: destination.uic,
    };
  }
  return {
    autour: 'depart',
    emplacement: 'haut',
    titre: origine === 'position' ? 'Près de vous' : `Près de la gare de ${gareDepart}`,
  };
}
