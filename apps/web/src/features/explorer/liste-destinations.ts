'use client';

// Liste des destinations d'Explorer, partagée par la feuille de résultats et la feuille « Votre trajet »
// (D084) : même requête (cache TanStack Query), mêmes filtres d'interface, aucun appel en double.
import { useMemo } from 'react';

import { useDestinations } from '@/features/destinations/hooks';
import { sansTrainsPartis } from '@/features/destinations/presentation';
import { useMaintenant } from '@/lib/dates/use-maintenant';

import type { Filtres } from './filtres';
import { filtrerDestinations } from './recherche-destination';

export function useListeDestinations(gareUic: string, filtres: Filtres) {
  const maintenant = useMaintenant();
  const requete = useDestinations({
    gare: gareUic,
    date: filtres.date,
    categories: filtres.categories,
    dureeMax: filtres.dureeMax,
  });
  const reponse = requete.data;
  // Une autre date, choisie exprès, montre sa journée entière.
  const pourAujourdhui = filtres.date === null || filtres.date === maintenant.dateDuJour;

  // « Faisable dans la journée » s'applique ici, dans l'interface (docs/05-api.md § 3.4). Gardée entre
  // deux affichages : une nouvelle liste ferait recalculer toutes les couches de la carte.
  const avantRecherche = useMemo(() => {
    const filtrees = filtres.faisable
      ? reponse?.destinations.filter((d) => d.faisableJournee)
      : reponse?.destinations;
    return filtrees && reponse && pourAujourdhui
      ? sansTrainsPartis(filtrees, reponse.date, maintenant)
      : filtrees;
  }, [reponse, filtres.faisable, pourAujourdhui, maintenant]);

  const { recherche, destination } = filtres;
  const liste = useMemo(
    () => avantRecherche && filtrerDestinations(avantRecherche, { recherche, destination }),
    [avantRecherche, recherche, destination],
  );

  return { requete, avantRecherche, liste };
}
