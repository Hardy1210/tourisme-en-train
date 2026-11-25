'use client';

import { TrainFront } from 'lucide-react';
import { Marker } from 'react-map-gl/maplibre';
import { parametres } from '@/config/parametres';
import {
  couleurTranche,
  formaterDuree,
  formaterNombreLieux,
  totalLieux,
  traitTranche,
} from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import type { LieuResume } from '@/features/lieux/schemas';
import { IconeCategorie } from '@/features/lieux/ui/icone-categorie';
import { cn } from '@/lib/classes';
import { formeEpingle } from '../epingle';
import type { Point } from '../geometrie';

// Épingles des lieux en pixels CSS : 30 px, et 40 px pour le lieu touché (maquette « Explorer »).
const FORME_NORMALE = formeEpingle(15);
const FORME_TOUCHEE = formeEpingle(20);

/**
 * Épingles des lieux de la carte d'une destination (D119) : la même goutte que dans Explorer
 * (`formeEpingle`), pointe sur le lieu ; le lieu touché, plus grand et plein, sans anneau.
 */
export function MarqueursLieux({
  lieux,
  cleChoisie = null,
  surChoix,
}: {
  lieux: readonly Pick<LieuResume, 'cle' | 'nom' | 'categorie' | 'lat' | 'lon'>[];
  cleChoisie?: string | null;
  surChoix: (cle: string) => void;
}) {
  return lieux.map((lieu) => {
    const touchee = lieu.cle === cleChoisie;
    const forme = touchee ? FORME_TOUCHEE : FORME_NORMALE;
    return (
      <Marker
        key={lieu.cle}
        latitude={lieu.lat}
        longitude={lieu.lon}
        anchor="bottom"
        style={{ zIndex: touchee ? 2 : 1 }}
      >
        <button
          type="button"
          aria-label={lieu.nom}
          aria-pressed={touchee}
          onClick={(evenement) => {
            evenement.stopPropagation();
            surChoix(lieu.cle);
          }}
          className="flex min-h-touch min-w-touch cursor-pointer items-end justify-center"
        >
          <span className="relative block" style={{ width: forme.largeur, height: forme.hauteur }}>
            <svg
              aria-hidden="true"
              width={forme.largeur}
              height={forme.hauteur}
              className={cn(
                'absolute inset-0',
                touchee
                  ? 'fill-epingle-touchee-bg stroke-epingle-touchee-bg'
                  : 'fill-epingle-bg stroke-epingle-trait',
              )}
            >
              <path d={forme.chemin} strokeWidth={1.5} />
            </svg>
            <span
              className="absolute flex -translate-1/2 items-center justify-center"
              style={{ left: forme.cx, top: forme.cy }}
            >
              <IconeCategorie
                categorie={lieu.categorie}
                className={touchee ? 'size-5 text-epingle-touchee-texte' : 'size-4'}
              />
            </span>
          </span>
        </button>
      </Marker>
    );
  });
}

/**
 * Gares de destination (D118, remarque ⑥) : de loin, des points colorés par le temps de train ; de près
 * (`icones`), des icônes de train inversées, contour et train dans la même couleur. La destination du
 * trajet (`uicCherche`, la ligne « Arrivée » de la barre) a un bord jaune ; une gare touchée grandit. Le bouton garde sa taille (44 px) et son nom : rien ne change dans le fonctionnement.
 */
export function MarqueursDestinations({
  destinations,
  uicChoisi,
  uicCherche,
  icones,
  survolee,
  surSurvol,
  surChoix,
}: {
  destinations: readonly Destination[];
  uicChoisi: string | null;
  /** Destination cherchée dans la page « Trajet » (`filtres.destination`) : bord jaune (D118). */
  uicCherche: string | null;
  /** Zoom au moins `parametres.carte.zoomIconesGares` (`garesEnIcones`). */
  icones: boolean;
  survolee: string | null;
  surSurvol: (uic: string | null) => void;
  surChoix: (uic: string) => void;
}) {
  return destinations.map((d) => {
    const choisie = uicChoisi === d.gare.uic;
    const enAvant = choisie || survolee === d.gare.uic;
    const cherchee = uicCherche === d.gare.uic;
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
          {icones ? (
            <span
              className={cn(
                'flex items-center justify-center rounded-md border-2 bg-surface shadow-xs',
                enAvant ? 'size-9' : 'size-7.5',
                traitTranche(d.trancheTemps, parametres.durees.tranchesTempsMin),
                cherchee && 'ring-3 ring-map-gare-choisie',
              )}
            >
              <TrainFront aria-hidden="true" className={enAvant ? 'size-5' : 'size-4'} />
            </span>
          ) : (
            <span
              className={cn(
                'rounded-pill border-2 border-map-halo shadow-xs',
                enAvant ? 'size-5' : 'size-3.5',
                couleurTranche(d.trancheTemps, parametres.durees.tranchesTempsMin),
                cherchee && 'ring-3 ring-map-gare-choisie',
              )}
            />
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
