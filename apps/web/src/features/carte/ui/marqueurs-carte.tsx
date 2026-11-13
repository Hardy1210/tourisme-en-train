'use client';

import { TrainFront } from 'lucide-react';
import { Marker } from 'react-map-gl/maplibre';
import { parametres } from '@/config/parametres';
import {
  couleurTranche,
  formaterDuree,
  formaterNombreLieux,
  totalLieux,
} from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import type { LieuResume } from '@/features/lieux/schemas';
import { IconeCategorie } from '@/features/lieux/ui/icone-categorie';
import { cn } from '@/lib/classes';
import type { Point } from '../geometrie';

export function MarqueursLieux({
  lieux,
  cleChoisie = null,
  surChoix,
}: {
  lieux: readonly Pick<LieuResume, 'cle' | 'nom' | 'categorie' | 'lat' | 'lon'>[];
  cleChoisie?: string | null;
  surChoix: (cle: string) => void;
}) {
  return lieux.map((lieu) => (
    <Marker
      key={lieu.cle}
      latitude={lieu.lat}
      longitude={lieu.lon}
      style={{ zIndex: lieu.cle === cleChoisie ? 2 : 1 }}
    >
      <button
        type="button"
        aria-label={lieu.nom}
        aria-pressed={lieu.cle === cleChoisie}
        onClick={(evenement) => {
          evenement.stopPropagation();
          surChoix(lieu.cle);
        }}
        className="flex size-touch cursor-pointer items-center justify-center"
      >
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-pill bg-surface shadow-xs',
            lieu.cle === cleChoisie && 'ring-2 ring-primary',
          )}
        >
          <IconeCategorie categorie={lieu.categorie} className="size-4" />
        </span>
      </button>
    </Marker>
  ));
}

export function MarqueursDestinations({
  destinations,
  uicChoisi,
  survolee,
  surSurvol,
  surChoix,
}: {
  destinations: readonly Destination[];
  uicChoisi: string | null;
  survolee: string | null;
  surSurvol: (uic: string | null) => void;
  surChoix: (uic: string) => void;
}) {
  return destinations.map((d) => {
    const choisie = uicChoisi === d.gare.uic;
    const enAvant = choisie || survolee === d.gare.uic;
    const nombre = totalLieux(d.lieuxParCategorie);
    return (
      <Marker
        key={d.gare.uic}
        latitude={d.gare.lat}
        longitude={d.gare.lon}
        style={{ zIndex: enAvant ? 2 : 1 }}
      >
        <button
          type="button"
          aria-label={`${d.titre}, ${formaterDuree(d.dureeMin)} en train direct${
            nombre > 0 ? `, ${formaterNombreLieux(nombre)} à pied depuis la gare` : ''
          }`}
          aria-pressed={choisie}
          onMouseEnter={() => surSurvol(d.gare.uic)}
          onMouseLeave={() => surSurvol(null)}
          onClick={(evenement) => {
            evenement.stopPropagation();
            surChoix(d.gare.uic);
          }}
          className="relative flex size-touch cursor-pointer items-center justify-center"
        >
          <span
            className={cn(
              'rounded-pill border-2 border-map-halo shadow-xs',
              enAvant ? 'size-5' : 'size-3.5',
              couleurTranche(d.trancheTemps, parametres.durees.tranchesTempsMin),
            )}
          />
          {/* Bulle à côté du point, sans le recouvrir : lieux à voir à pied, catégories choisies (maquette v6). */}
          {nombre > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                'tabular pointer-events-none absolute bottom-[calc(50%+3px)] left-[calc(50%+3px)] flex h-5 min-w-5 items-center justify-center rounded-pill border border-border-strong bg-surface px-1 text-2xs leading-none font-bold text-foreground shadow-xs',
                enAvant && 'ring-2 ring-primary',
              )}
            >
              {nombre}
            </span>
          )}
        </button>
      </Marker>
    );
  });
}

export function MarqueurGareDepart({ gare }: { gare: Point & { nom: string } }) {
  return (
    <Marker latitude={gare.lat} longitude={gare.lon} style={{ zIndex: 3 }}>
      <span
        role="img"
        aria-label={`Gare de ${gare.nom}`}
        className="flex size-7 items-center justify-center rounded-md border-2 border-map-halo bg-map-station"
      >
        <TrainFront aria-hidden="true" className="size-4 text-primary-foreground" />
      </span>
    </Marker>
  );
}

export function MarqueurUtilisateur({ position }: { position: Point }) {
  return (
    <Marker latitude={position.lat} longitude={position.lon} style={{ zIndex: 4 }}>
      <span
        role="img"
        aria-label="Votre position"
        className="block size-4 animate-pulse-dot rounded-pill border-2 border-map-halo bg-map-user"
      />
    </Marker>
  );
}
