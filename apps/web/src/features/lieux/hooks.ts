'use client';

import type { Categorie } from '@tourisme/commun';
import { useQuery } from '@tanstack/react-query';
import { lireApi } from '@/lib/http/client';
import { schemaFicheLieu, schemaReponseAutour } from './schemas';

type Options = {
  point: { lat: number; lon: number };
  rayon: number;
  categories: readonly Categorie[];
};

/** Lieux à pied d'un point. La position reste en mémoire : aucune persistance du cache (règle 5). */
export function useLieuxAutour({ point, rayon, categories }: Options) {
  const requete = new URLSearchParams({
    lat: String(point.lat),
    lon: String(point.lon),
    rayon: String(rayon),
  });
  if (categories.length > 0) requete.set('categories', categories.join(','));
  const chemin = `/api/autour?${requete.toString()}`;
  return useQuery({
    queryKey: ['autour', chemin],
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseAutour, signal),
  });
}

/** Lieux à pied de la gare d'arrivée ; rien à demander hors région (`lieuxCharges` faux). */
export function useLieuxGare(uic: string, actif: boolean) {
  const chemin = `/api/destinations/${uic}/lieux`;
  return useQuery({
    queryKey: ['lieux-gare', chemin],
    enabled: actif,
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseAutour, signal),
  });
}

export function useFicheLieu(cle: string) {
  const chemin = `/api/lieux/${encodeURIComponent(cle)}`;
  return useQuery({
    queryKey: ['fiche-lieu', chemin],
    queryFn: ({ signal }) => lireApi(chemin, schemaFicheLieu, signal),
  });
}
