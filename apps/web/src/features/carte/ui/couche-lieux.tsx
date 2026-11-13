'use client';
// Tous les lieux sur la carte (D091) : regroupés en bulles (nombre de lieux) qui se divisent en zoomant,
// puis chacun avec l'icône de sa catégorie. Regroupement natif de MapLibre (supercluster).
import type { Categorie } from '@tourisme/commun';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { parametres } from '@/config/parametres';
import type { ReponseLieuxCarte } from '@/features/lieux/schemas';
import { PREFIXE_IMAGE } from '../icones-categories';

export const SOURCE_LIEUX = 'lieux';
export const COUCHE_BULLES = 'lieux-bulles';
export const COUCHE_ICONES = 'lieux-icones';

export type ProprietesLieu = { cle: string; categorie: Categorie };

/**
 * Lieux en GeoJSON, filtrés par les catégories choisies (catégorie principale ou secondaire, D060). Le
 * filtre se fait sur les données : celui d'une couche ne changerait pas le nombre des bulles.
 */
export function lieuxGeoJson(lieux: ReponseLieuxCarte['lieux'], categories: readonly Categorie[]) {
  const garde = (principale: Categorie, secondaires: readonly Categorie[]) =>
    categories.length === 0 ||
    categories.includes(principale) ||
    secondaires.some((c) => categories.includes(c));
  return {
    type: 'FeatureCollection' as const,
    features: lieux
      .filter(([, , , categorie, secondaires]) => garde(categorie, secondaires))
      .map(([cle, lat, lon, categorie]) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lon, lat] },
        properties: { cle, categorie } satisfies ProprietesLieu,
      })),
  };
}

export function CoucheLieux({
  lieux,
  categories,
  couleurs,
}: {
  lieux: ReponseLieuxCarte['lieux'];
  categories: readonly Categorie[];
  couleurs: { bulle: string; texteBulle: string; halo: string };
}) {
  const donnees = useMemo(() => lieuxGeoJson(lieux, categories), [lieux, categories]);
  const { bullesRayonPx, bullesZoomMax, bullesDecalagePx } = parametres.acces;
  return (
    <Source
      id={SOURCE_LIEUX}
      type="geojson"
      data={donnees}
      cluster
      clusterRadius={bullesRayonPx}
      clusterMaxZoom={bullesZoomMax}
    >
      <Layer
        id={COUCHE_BULLES}
        type="circle"
        filter={['has', 'point_count']}
        paint={{
          'circle-color': couleurs.bulle,
          'circle-translate': bullesDecalagePx,
          'circle-stroke-color': couleurs.halo,
          'circle-stroke-width': 2,
          // Plus de lieux, plus grande bulle : 15 px, 19 px dès 10 lieux, 24 px dès 100.
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 100, 24],
        }}
      />
      <Layer
        id={`${COUCHE_BULLES}-nombre`}
        type="symbol"
        filter={['has', 'point_count']}
        layout={{
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
          'text-allow-overlap': true,
        }}
        paint={{ 'text-color': couleurs.texteBulle, 'text-translate': bullesDecalagePx }}
      />
      <Layer
        id={COUCHE_ICONES}
        type="symbol"
        filter={['!', ['has', 'point_count']]}
        layout={{
          'icon-image': ['concat', PREFIXE_IMAGE, ['get', 'categorie']],
          'icon-allow-overlap': true,
        }}
      />
    </Source>
  );
}
