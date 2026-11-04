'use client';

import { Layer, Source } from 'react-map-gl/maplibre';
import type { pointsEtiquettes, segmentsDepuis } from '../geometrie';
import type { CouleursCarte } from '../style';

type Proprietes = {
  segments: ReturnType<typeof segmentsDepuis>;
  etiquettes: ReturnType<typeof pointsEtiquettes>;
  couleurs: CouleursCarte;
};

/** Segments droits gare de départ → destinations, et étiquettes des destinations mises en avant. */
export function CouchesCarte({ segments, etiquettes, couleurs }: Proprietes) {
  return (
    <>
      <Source type="geojson" data={segments}>
        <Layer
          id="segments"
          type="line"
          paint={{
            'line-color': couleurs.route,
            'line-width': 1,
            'line-opacity': 0.3,
          }}
        />
      </Source>

      <Source type="geojson" data={etiquettes}>
        <Layer
          id="etiquettes"
          type="symbol"
          layout={{
            'text-field': ['get', 'etiquette'],
            'text-font': ['Noto Sans Bold'],
            'text-size': 12,
            'text-anchor': 'left',
            'text-offset': [1, 0],
            'symbol-sort-key': ['get', 'priorite'],
          }}
          paint={{
            'text-color': couleurs.texteFort,
            'text-halo-color': couleurs.halo,
            'text-halo-width': 2,
          }}
        />
      </Source>
    </>
  );
}
