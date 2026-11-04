'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { LocateFixed, TrainFront } from 'lucide-react';
import type { StyleSpecification } from 'maplibre-gl';
import { useRef, useState } from 'react';
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/maplibre';
import { Bouton } from '@/components/ui/bouton';
import { parametres } from '@/config/parametres';
import { couleurTranche, formaterDuree } from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import type { LieuResume } from '@/features/lieux/schemas';
import { IconeCategorie } from '@/features/lieux/ui/icone-categorie';
import { cn } from '@/lib/classes';
import { attributionFondCarte } from '@/lib/external/fond-carte';
import {
  clesEtiquetees,
  empriseDe,
  pointsCadrage,
  pointsEtiquettes,
  segmentsDepuis,
  type Point,
} from '../geometrie';
import { useStyleCarte } from '../hooks';
import { MiniFicheDestination, MiniFicheLieu } from './mini-fiche';

type Selection = { type: 'destination'; uic: string } | { type: 'lieu'; cle: string } | null;

export type ProprietesCarte = {
  /** Position de l'utilisateur ; null s'il a choisi une gare. */
  utilisateur: Point | null;
  gareDepart: Point & { nom: string };
  destinations: readonly Destination[];
  lieux: readonly LieuResume[];
  lienDe: (destination: Destination) => string;
};

const MARGE = { padding: 48, maxZoom: 12, duration: 0 };

/** Fond OpenFreeMap aux couleurs des tokens ; toute information figure aussi dans la liste (`06` § 6). */
export function CarteExplorer({
  utilisateur,
  gareDepart,
  destinations,
  lieux,
  lienDe,
}: ProprietesCarte) {
  const carte = useRef<MapRef>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [zoom, setZoom] = useState(0);
  const style = useStyleCarte();

  const arrivees = destinations.map((d) => ({ lat: d.gare.lat, lon: d.gare.lon }));
  const emprise = empriseDe([
    ...pointsCadrage(
      gareDepart,
      destinations.map((d) => ({ lat: d.gare.lat, lon: d.gare.lon, dureeMin: d.dureeMin })),
      parametres.carte.dureeCadrageMin,
    ),
    ...(utilisateur ? [utilisateur] : []),
  ]);
  const etiquetees = clesEtiquetees(
    destinations.map((d) => ({ uic: d.gare.uic, dureeMin: d.dureeMin })),
    selection?.type === 'destination' ? selection.uic : null,
    parametres.carte.etiquettesMax,
  );
  const uicChoisi = selection?.type === 'destination' ? selection.uic : null;
  const etiquettes = pointsEtiquettes(
    destinations.map((d) => ({
      uic: d.gare.uic,
      lat: d.gare.lat,
      lon: d.gare.lon,
      etiquette: `${d.titre} ${formaterDuree(d.dureeMin)}`,
    })),
    etiquetees,
    uicChoisi,
  );
  const destinationChoisie =
    selection?.type === 'destination'
      ? destinations.find((d) => d.gare.uic === selection.uic)
      : undefined;
  const lieuChoisi =
    selection?.type === 'lieu' ? lieux.find((l) => l.cle === selection.cle) : undefined;

  if (style.isError) {
    return (
      <p className="rounded-carte bg-surface-sunken p-4 text-sm text-muted-foreground">
        La carte n&apos;est pas disponible pour le moment. Toutes les informations restent dans la
        liste ci-dessous.
      </p>
    );
  }
  if (!style.data || !emprise) {
    return <div aria-hidden="true" className="h-(--carte-geo-hauteur) rounded-carte bg-map-land" />;
  }

  return (
    <div
      role="region"
      aria-label="Carte des lieux et des destinations"
      className="relative h-(--carte-geo-hauteur) overflow-hidden rounded-carte"
    >
      {/* Isolée : les épingles restent sous la mini-fiche et le bouton. */}
      <div className="absolute inset-0 isolate">
        <Map
          ref={carte}
          mapStyle={style.data.style as StyleSpecification}
          initialViewState={{ bounds: emprise, fitBoundsOptions: MARGE }}
          attributionControl={false}
          onClick={() => setSelection(null)}
          onLoad={(evenement) => setZoom(evenement.target.getZoom())}
          onZoomEnd={(evenement) => setZoom(evenement.target.getZoom())}
        >
          <Source type="geojson" data={segmentsDepuis(gareDepart, arrivees)}>
            <Layer
              id="segments"
              type="line"
              paint={{
                'line-color': style.data.couleurs.route,
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
                'text-color': style.data.couleurs.texteFort,
                'text-halo-color': style.data.couleurs.halo,
                'text-halo-width': 2,
              }}
            />
          </Source>

          {zoom >= parametres.carte.zoomMinLieux &&
            lieux.map((lieu) => (
              <Marker key={lieu.cle} latitude={lieu.lat} longitude={lieu.lon}>
                <button
                  type="button"
                  aria-label={lieu.nom}
                  onClick={(evenement) => {
                    evenement.stopPropagation();
                    setSelection({ type: 'lieu', cle: lieu.cle });
                  }}
                  className="flex size-touch cursor-pointer items-center justify-center"
                >
                  <span className="flex size-7 items-center justify-center rounded-pill bg-surface shadow-xs">
                    <IconeCategorie categorie={lieu.categorie} className="size-4" />
                  </span>
                </button>
              </Marker>
            ))}

          {destinations.map((d) => {
            const choisie = selection?.type === 'destination' && selection.uic === d.gare.uic;
            return (
              <Marker
                key={d.gare.uic}
                latitude={d.gare.lat}
                longitude={d.gare.lon}
                style={{ zIndex: choisie ? 2 : 1 }}
              >
                <button
                  type="button"
                  aria-label={`${d.titre}, ${formaterDuree(d.dureeMin)} en train direct`}
                  aria-pressed={choisie}
                  onClick={(evenement) => {
                    evenement.stopPropagation();
                    setSelection({ type: 'destination', uic: d.gare.uic });
                  }}
                  className="relative flex size-touch cursor-pointer items-center justify-center"
                >
                  <span
                    className={cn(
                      'rounded-pill border-2 border-map-halo shadow-xs',
                      choisie ? 'size-5' : 'size-3.5',
                      couleurTranche(d.trancheTemps, parametres.durees.tranchesTempsMin),
                    )}
                  />
                </button>
              </Marker>
            );
          })}

          <Marker latitude={gareDepart.lat} longitude={gareDepart.lon} style={{ zIndex: 3 }}>
            <span
              role="img"
              aria-label={`Gare de ${gareDepart.nom}`}
              className="flex size-7 items-center justify-center rounded-md border-2 border-map-halo bg-map-station"
            >
              <TrainFront aria-hidden="true" className="size-4 text-primary-foreground" />
            </span>
          </Marker>

          {utilisateur && (
            <Marker latitude={utilisateur.lat} longitude={utilisateur.lon} style={{ zIndex: 4 }}>
              <span
                role="img"
                aria-label="Votre position"
                className="block size-4 animate-pulse-dot rounded-pill border-2 border-map-halo bg-map-user"
              />
            </Marker>
          )}
        </Map>
      </div>

      {/* Attribution exigée par la licence, toujours visible (config/sources.json). */}
      <p className="absolute inset-x-0 bottom-0 bg-surface/80 px-2 py-0.5 text-2xs text-muted-foreground">
        {attributionFondCarte}
      </p>

      <Bouton
        variante="secondaire"
        forme="icone"
        aria-label="Recentrer"
        className="absolute top-3 right-3 rounded-pill shadow-xs"
        onClick={() => {
          setSelection(null);
          carte.current?.fitBounds(emprise, MARGE);
        }}
      >
        <LocateFixed aria-hidden="true" className="size-5 text-primary" />
      </Bouton>

      {destinationChoisie && (
        <MiniFicheDestination
          destination={destinationChoisie}
          lien={lienDe(destinationChoisie)}
          surFermeture={() => setSelection(null)}
        />
      )}
      {lieuChoisi && <MiniFicheLieu lieu={lieuChoisi} surFermeture={() => setSelection(null)} />}
    </div>
  );
}
