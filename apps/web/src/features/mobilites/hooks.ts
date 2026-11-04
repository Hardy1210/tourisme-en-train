'use client';

import { useQuery } from '@tanstack/react-query';
import { lireApi } from '@/lib/http/client';
import { schemaReponseMobilites } from './schemas';

export function useMobilites(uic: string) {
  const chemin = `/api/mobilites/${uic}`;
  return useQuery({
    queryKey: ['mobilites', chemin],
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseMobilites, signal),
  });
}
