'use client';

import { dateDuJour, type Categorie } from '@tourisme/commun';
import { useQuery } from '@tanstack/react-query';
import { parametres } from '@/config/parametres';
import { lireApi } from '@/lib/http/client';
import { schemaFicheDestination, schemaReponseDestinations } from './schemas';

const DUREE_HORAIRES_MS = parametres.cache.horairesPrevusS * 1000;

type Options = {
  gare: string;
  date: string | null;
  categories: readonly Categorie[];
  dureeMax: number;
};

export function useDestinations({ gare, date, categories, dureeMax }: Options) {
  const requete = new URLSearchParams({ gare, dureeMax: String(dureeMax) });
  if (date !== null) requete.set('date', date);
  if (categories.length > 0) requete.set('categories', categories.join(','));
  const chemin = `/api/destinations?${requete.toString()}`;
  return useQuery({
    queryKey: ['destinations', chemin],
    staleTime: DUREE_HORAIRES_MS,
    // Aujourd'hui seulement : le prochain train dépend de l'heure (D068).
    refetchInterval: date === null || date === dateDuJour() ? DUREE_HORAIRES_MS : false,
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseDestinations, signal),
  });
}

export function useFicheDestination(uic: string, depuis: string | null, date: string | null) {
  const requete = new URLSearchParams();
  if (depuis !== null) requete.set('depuis', depuis);
  if (date !== null) requete.set('date', date);
  const chemin = `/api/destinations/${uic}?${requete.toString()}`;
  return useQuery({
    queryKey: ['fiche-destination', chemin],
    queryFn: ({ signal }) => lireApi(chemin, schemaFicheDestination, signal),
  });
}
