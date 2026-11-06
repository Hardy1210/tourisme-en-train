'use client';

import { useQuery } from '@tanstack/react-query';
import { parametres } from '@/config/parametres';
import { lireApi } from '@/lib/http/client';
import { schemaReponseArretsTrain, schemaReponseTrains } from './schemas';

export function useTrains(depart: string, arrivee: string, date: string | null) {
  const requete = new URLSearchParams({ depart, arrivee });
  if (date !== null) requete.set('date', date);
  const chemin = `/api/trains?${requete.toString()}`;
  return useQuery({
    queryKey: ['trains', chemin],
    staleTime: parametres.cache.horairesPrevusS * 1000,
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseTrains, signal),
  });
}

/** Arrêts du train vers `arrivee` ; aucun appel tant qu'aucune destination n'est sélectionnée (D074). */
export function useArretsTrain(depart: string, arrivee: string | null, date: string | null) {
  const requete = new URLSearchParams({ depart, arrivee: arrivee ?? '' });
  if (date !== null) requete.set('date', date);
  const chemin = `/api/trains/arrets?${requete.toString()}`;
  return useQuery({
    queryKey: ['trains-arrets', chemin],
    enabled: arrivee !== null,
    staleTime: parametres.cache.horairesPrevusS * 1000,
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseArretsTrain, signal),
  });
}
