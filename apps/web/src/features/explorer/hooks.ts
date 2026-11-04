'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useGare, useGaresProches } from '@/features/gares/hooks';
import { usePosition } from '@/features/localisation/hooks';
import { schemaReponseSources } from '@/features/presentation/schemas';
import { ErreurClient, lireApi } from '@/lib/http/client';
import { calculerDepart } from './depart';
import { ecrireFiltres, lireFiltres, type Filtres } from './filtres';

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

/** Filtres lus dans l'URL ; chaque changement crée une entrée d'historique (retour arrière). */
export function useFiltres() {
  const routeur = useRouter();
  const chemin = usePathname();
  const parametresUrl = useSearchParams();
  const filtres = lireFiltres(parametresUrl);

  const changer = useCallback(
    (modifications: Partial<Filtres>) => {
      const actuels = new URLSearchParams(parametresUrl.toString());
      const suite = ecrireFiltres(actuels, { ...lireFiltres(actuels), ...modifications });
      const texte = suite.toString();
      routeur.push(texte ? `${chemin}?${texte}` : chemin, { scroll: false });
    },
    [chemin, parametresUrl, routeur],
  );

  return { filtres, changer };
}

/** Jusqu'où les horaires sont chargés, pour borner le calendrier. */
export function useFenetreHoraires() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: ({ signal }) => lireApi('/api/sources', schemaReponseSources, signal),
    select: (reponse) => reponse.horaires,
  });
}
