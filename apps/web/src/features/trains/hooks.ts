'use client';

import { useQuery } from '@tanstack/react-query';
import { lireApi } from '@/lib/http/client';
import { schemaReponseTrains } from './schemas';

export function useTrains(depart: string, arrivee: string, date: string | null) {
  const requete = new URLSearchParams({ depart, arrivee });
  if (date !== null) requete.set('date', date);
  const chemin = `/api/trains?${requete.toString()}`;
  return useQuery({
    queryKey: ['trains', chemin],
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseTrains, signal),
  });
}
