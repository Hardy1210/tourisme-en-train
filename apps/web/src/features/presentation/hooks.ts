'use client';

import { useQuery } from '@tanstack/react-query';
import { lireApi } from '@/lib/http/client';
import { schemaReponseSources } from './schemas';

/** Sources affichées ; même clé qu'Explorer, qui y lit les dates couvertes par les horaires. */
export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: ({ signal }) => lireApi('/api/sources', schemaReponseSources, signal),
  });
}
