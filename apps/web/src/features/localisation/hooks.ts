'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { parametres } from '@/config/parametres';
import { useEcranVisible } from '@/lib/ecran-visible';
import { lireApi } from '@/lib/http/client';
import { schemaReponseGeocodage, schemaReponseInverse } from './schemas';

const { delaiSaisieMs, longueurMinRecherche } = parametres.localisation;

/** Nom de la commune où se trouve l'utilisateur, pour la puce « Autour de … ». */
export function useCommune(position: { lat: number; lon: number } | null) {
  const visible = useEcranVisible();
  return useQuery({
    queryKey: ['commune', position?.lat, position?.lon],
    enabled: visible && position !== null,
    queryFn: ({ signal }) =>
      lireApi(
        `/api/geocodage/inverse?lat=${position?.lat}&lon=${position?.lon}`,
        schemaReponseInverse,
        signal,
      ),
  });
}

/** Recherche de ville ou de gare, lancée après une courte pause dans la saisie. */
export function useRechercheVille(texte: string) {
  const [recherche, setRecherche] = useState('');
  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(texte.trim()), delaiSaisieMs);
    return () => clearTimeout(minuteur);
  }, [texte]);

  return useQuery({
    queryKey: ['geocodage', recherche],
    enabled: recherche.length >= longueurMinRecherche,
    queryFn: ({ signal }) =>
      lireApi(`/api/geocodage?q=${encodeURIComponent(recherche)}`, schemaReponseGeocodage, signal),
  });
}
