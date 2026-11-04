'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import type { StyleSpecification } from 'maplibre-gl';
import { useRef, useState } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import { parametres } from '@/config/parametres';
import { formaterDuree } from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import type { LieuResume } from '@/features/lieux/schemas';
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
import { CommandesCarte } from './commandes-carte';
import { CouchesCarte } from './couches-carte';
import {
  MarqueurGareDepart,
  MarqueursDestinations,
  MarqueursLieux,
  MarqueurUtilisateur,
} from './marqueurs-carte';
import { MiniFicheDestination, MiniFicheLieu } from './mini-fiche';

type Selection = { type: 'destination'; uic: string } | { type: 'lieu'; cle: string } | null;

export type ProprietesCarte = {
  /** Position de l'utilisateur ; null s'il a choisi une gare. */
  utilisateur: Point | null;
  gareDepart: Point & { nom: string };
  destinations: readonly Destination[];
  lieux: readonly LieuResume[];
  lienDe: (destination: Destination) => string;
  /** Hauteur en pixels cachée en bas par la feuille de résultats, pour cadrer dans ce qui reste. */
  masqueEnBas: () => number;
  /** Carte plein écran sur mobile. */
  pleinEcran: { actif: boolean; bascule: () => void };
  /** Survol croisé sur grand écran : la destination survolée ici ou dans la liste. */
  survolee: string | null;
  surSurvol: (uic: string | null) => void;
};

const MARGE_PX = 48;

/** Fond OpenFreeMap aux couleurs des tokens ; toute information figure aussi dans la liste (`06` § 6). */
export function CarteExplorer({
  utilisateur,
  gareDepart,
  destinations,
  lieux,
  lienDe,
  masqueEnBas,
  pleinEcran,
  survolee,
  surSurvol,
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
  const uicChoisi = selection?.type === 'destination' ? selection.uic : null;
  const etiquetees = clesEtiquetees(
    destinations.map((d) => ({ uic: d.gare.uic, nbTrains: d.nbTrains, dureeMin: d.dureeMin })),
    uicChoisi,
    parametres.carte.etiquettesMax,
  );
  if (survolee !== null) etiquetees.add(survolee);
  const marge = () => ({
    padding: { top: MARGE_PX, left: MARGE_PX, right: MARGE_PX, bottom: MARGE_PX + masqueEnBas() },
    maxZoom: 12,
    duration: 0,
  });
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
  const destinationChoisie = destinations.find((d) => d.gare.uic === uicChoisi);
  const lieuChoisi =
    selection?.type === 'lieu' ? lieux.find((l) => l.cle === selection.cle) : undefined;

  if (style.isError) {
    return (
      <p className="h-full bg-surface-sunken p-4 text-sm text-muted-foreground">
        La carte n&apos;est pas disponible pour le moment. Toutes les informations restent dans la
        liste ci-dessous.
      </p>
    );
  }
  if (!style.data || !emprise) {
    return <div aria-hidden="true" className="h-full bg-map-land" />;
  }

  return (
    <div
      role="region"
      aria-label="Carte des lieux et des destinations"
      className="relative h-full overflow-hidden"
    >
      {/* Isolée : les épingles restent sous la mini-fiche et le bouton. */}
      <div className="absolute inset-0 isolate">
        <Map
          ref={carte}
          mapStyle={style.data.style as StyleSpecification}
          initialViewState={{
            bounds: emprise,
            fitBoundsOptions: { padding: MARGE_PX, maxZoom: 12 },
          }}
          attributionControl={false}
          onClick={() => setSelection(null)}
          onLoad={(evenement) => {
            evenement.target.fitBounds(emprise, marge());
            setZoom(evenement.target.getZoom());
          }}
          onZoomEnd={(evenement) => setZoom(evenement.target.getZoom())}
        >
          <CouchesCarte
            segments={segmentsDepuis(gareDepart, arrivees)}
            etiquettes={etiquettes}
            couleurs={style.data.couleurs}
          />
          {zoom >= parametres.carte.zoomMinLieux && (
            <MarqueursLieux lieux={lieux} surChoix={(cle) => setSelection({ type: 'lieu', cle })} />
          )}
          <MarqueursDestinations
            destinations={destinations}
            uicChoisi={uicChoisi}
            survolee={survolee}
            surSurvol={surSurvol}
            surChoix={(uic) => setSelection({ type: 'destination', uic })}
          />
          <MarqueurGareDepart gare={gareDepart} />
          {utilisateur && <MarqueurUtilisateur position={utilisateur} />}
        </Map>
      </div>

      {/* Attribution exigée par la licence, toujours visible (config/sources.json). */}
      <p className="absolute inset-x-0 top-(--resultats-haut) -translate-y-full bg-surface/80 px-2 py-0.5 text-2xs text-muted-foreground lg:pb-1">
        {attributionFondCarte}
      </p>

      <CommandesCarte
        surRecentrer={() => {
          setSelection(null);
          carte.current?.fitBounds(emprise, marge());
        }}
        pleinEcran={pleinEcran}
      />

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
