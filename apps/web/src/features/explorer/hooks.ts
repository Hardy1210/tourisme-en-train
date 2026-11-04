'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useGare, useGaresProches } from '@/features/gares/hooks';
import { usePosition } from '@/features/localisation/hooks';
import { ErreurClient } from '@/lib/http/client';
import { calculerDepart } from './depart';

const statutDe = (erreur: unknown): number | null => {
  if (erreur === null) return null;
  return erreur instanceof ErreurClient ? erreur.statut : 500;
};

/**
 * Gare de départ de l'écran. `?gare=<uic>` n'est écrit que sur un choix de l'utilisateur : la gare
 * la plus proche, calculée depuis sa position, ne doit jamais se retrouver dans un lien (D058).
 */
export function useDepart() {
  const routeur = useRouter();
  const chemin = usePathname();
  const parametresUrl = useSearchParams();
  const uicChoisi = parametresUrl.get('gare');

  const { position, essais, redemander } = usePosition(uicChoisi === null);
  const point = position.etat === 'trouvee' ? { lat: position.lat, lon: position.lon } : null;
  const proches = useGaresProches(point);
  const gareChoisie = useGare(uicChoisi);

  const depart = calculerDepart({
    uicChoisi,
    gareChoisie: { donnees: gareChoisie.data, statutErreur: statutDe(gareChoisie.error) },
    position,
    proches: { donnees: proches.data?.gares, statutErreur: statutDe(proches.error) },
  });

  const ecrireGare = useCallback(
    (uic: string | null) => {
      const suite = new URLSearchParams(parametresUrl.toString());
      if (uic === null) suite.delete('gare');
      else suite.set('gare', uic);
      const texte = suite.toString();
      routeur.push(texte ? `${chemin}?${texte}` : chemin, { scroll: false });
    },
    [chemin, parametresUrl, routeur],
  );

  const revenirAMaPosition = useCallback(() => {
    ecrireGare(null);
    redemander();
  }, [ecrireGare, redemander]);

  return { depart, point, essais, choisirGare: ecrireGare, revenirAMaPosition };
}
