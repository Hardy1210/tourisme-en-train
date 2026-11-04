'use client';

import { useQuery } from '@tanstack/react-query';
import { lireApi } from '@/lib/http/client';
import { schemaImpact } from './schemas';

/** Chargé seulement à l'ouverture de « Comparer ». */
export function useImpact(depart: string, arrivee: string, actif: boolean) {
  const chemin = `/api/impact?${new URLSearchParams({ depart, arrivee }).toString()}`;
  return useQuery({
    queryKey: ['impact', chemin],
    enabled: actif,
    queryFn: ({ signal }) => lireApi(chemin, schemaImpact, signal),
  });
}
