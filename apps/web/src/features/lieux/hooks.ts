'use client';

import type { Categorie } from '@tourisme/commun';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEcranVisible } from '@/lib/ecran-visible';
import { lireApi } from '@/lib/http/client';
import {
  schemaFicheLieu,
  schemaReponseAutour,
  schemaReponseRangeesLieux,
  schemaReponseLieuxCarte,
  type ParametresLieuxCarte,
} from './schemas';

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
  const visible = useEcranVisible();
  return useQuery({
    queryKey: ['autour', chemin],
    enabled: visible,
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseAutour, signal),
  });
}

/**
 * Lieux à pied de la gare d'arrivée ; rien à demander hors région (`lieuxCharges` faux). Avec des
 * catégories : seulement celles-là (section « Près de la gare de… » d'Explorer).
 */
export function useLieuxGare(uic: string, actif: boolean, categories: readonly Categorie[] = []) {
  const suite = categories.length > 0 ? `?categories=${categories.join(',')}` : '';
  const chemin = `/api/destinations/${uic}/lieux${suite}`;
  return useQuery({
    queryKey: ['lieux-gare', chemin],
    enabled: actif,
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseAutour, signal),
  });
}

type OptionsRangees = {
  gare: string;
  date: string | null;
  categories: readonly Categorie[];
  dureeMax: number;
};

/**
 * Onglet Lieux en rangées (D121) : pages de rangées de `/api/lieux/rangees`, avec « Voir plus » ; les
 * rangées restent affichées pendant un changement de filtre.
 */
export function useRangeesLieux({ gare, date, categories, dureeMax }: OptionsRangees) {
  const requete = new URLSearchParams({ gare, dureeMax: String(dureeMax) });
  if (date !== null) requete.set('date', date);
  if (categories.length > 0) requete.set('categories', categories.join(','));
  const chemin = `/api/lieux/rangees?${requete.toString()}`;
  return useInfiniteQuery({
    queryKey: ['lieux-rangees', chemin],
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam, signal }) =>
      lireApi(`${chemin}&page=${pageParam}`, schemaReponseRangeesLieux, signal),
    getNextPageParam: (reponse) => reponse.pageSuivante,
  });
}

export function useFicheLieu(cle: string) {
  const chemin = `/api/lieux/${encodeURIComponent(cle)}`;
  return useQuery({
    queryKey: ['fiche-lieu', chemin],
    queryFn: ({ signal }) => lireApi(chemin, schemaFicheLieu, signal),
  });
}

/**
 * Lieux de la carte dans une zone (D094) : autour d'un point (rayon du filtre) et/ou autour de gares de
 * destination. `null` tant que la zone n'est pas connue (liste des destinations en chargement). Demandés
 * sans attendre la carte (D095) : 22 Ko, arrivés pendant qu'elle se charge.
 * Les bulles précédentes restent pendant le chargement de la nouvelle zone.
 */
export function useLieuxCarte(zone: ParametresLieuxCarte | null) {
  // Gares triées : la même liste dans un autre ordre garde la même réponse en mémoire.
  const visible = useEcranVisible();
  const requete = new URLSearchParams();
  if (zone?.lat !== undefined && zone.lon !== undefined && zone.rayon !== undefined) {
    requete.set('lat', String(zone.lat));
    requete.set('lon', String(zone.lon));
    requete.set('rayon', String(zone.rayon));
  }
  if (zone && zone.gares.length > 0) requete.set('gares', [...zone.gares].sort().join(','));
  const chemin = `/api/carte/lieux?${requete}`;
  return useQuery({
    queryKey: ['lieux-carte', chemin],
    enabled: visible && zone !== null,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => lireApi(chemin, schemaReponseLieuxCarte, signal),
  });
}
