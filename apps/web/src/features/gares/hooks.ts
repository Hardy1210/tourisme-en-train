'use client';

import { useQuery, type QueryClient } from '@tanstack/react-query';
import { schemaFicheDestination } from '@/features/destinations/schemas';
import { lireApi } from '@/lib/http/client';
import { schemaReponseGaresProches } from './schemas';

const optionsProches = (lat: number, lon: number) => ({
  queryKey: ['gares-proches', lat, lon],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    lireApi(`/api/gares/proches?lat=${lat}&lon=${lon}`, schemaReponseGaresProches, signal),
});

export function useGaresProches(position: { lat: number; lon: number } | null) {
  return useQuery({
    ...optionsProches(position?.lat ?? 0, position?.lon ?? 0),
    enabled: position !== null,
  });
}

/** Gare désignée par son code UIC (lien, choix de l'utilisateur). */
export function useGare(uic: string | null) {
  return useQuery({
    queryKey: ['gare', uic],
    enabled: uic !== null,
    queryFn: ({ signal }) => lireApi(`/api/destinations/${uic}`, schemaFicheDestination, signal),
    select: (fiche) => fiche.gare,
  });
}

/** Gare la plus proche d'un point choisi dans la recherche de ville ; null s'il n'y en a aucune. */
export async function gareLaPlusProche(client: QueryClient, lat: number, lon: number) {
  const { gares } = await client.fetchQuery(optionsProches(lat, lon));
  return gares[0] ?? null;
}
