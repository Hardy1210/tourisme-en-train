'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowRight } from 'lucide-react';
import type { StyleSpecification } from 'maplibre-gl';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import { parametres } from '@/config/parametres';
import type { LieuResume } from '@/features/lieux/schemas';
import { empriseDe, type Point } from '../geometrie';
import { useStyleCarte } from '../hooks';
import { AttributionFondCarte } from './attribution-fond-carte';
import { MarqueurGareDepart, MarqueursLieux } from './marqueurs-carte';

export type ProprietesCarteLieux = {
  /** Null sur la fiche d'un lieu : ses gares proches sont décrites à côté. */
  gare: (Point & { nom: string }) | null;
  lieux: readonly Pick<LieuResume, 'cle' | 'nom' | 'categorie' | 'lat' | 'lon'>[];
  cleChoisie: string | null;
  surChoix: (cle: string | null) => void;
  /** Adresse de la fiche d'un lieu ; sans elle, le choix d'une épingle n'ouvre pas de mini-fiche. */
  lienDe?: (cle: string) => string;
};

const MARGE_PX = 40;

/** La gare d'arrivée et ses lieux à pied ; toute information figure aussi dans la liste (`06` § 6). */
export function CarteLieux({ gare, lieux, cleChoisie, surChoix, lienDe }: ProprietesCarteLieux) {
  const carte = useRef<MapRef>(null);
  const style = useStyleCarte();
  const emprise = empriseDe([...(gare ? [gare] : []), ...lieux]);
  const { zoomMaxFiche } = parametres.carte;
  const choisi = lieux.find((l) => l.cle === cleChoisie);

  useEffect(() => {
    if (choisi) carte.current?.easeTo({ center: [choisi.lon, choisi.lat] });
  }, [choisi]);

  // La pilule n'a plus de bouton « Fermer » : Échap au clavier, ou un toucher ailleurs sur la carte.
  const pilule = Boolean(choisi && lienDe);
  useEffect(() => {
    if (!pilule) return;
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === 'Escape') surChoix(null);
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [pilule, surChoix]);

  if (style.isError) {
    return (
      <p className="h-full bg-surface-sunken p-4 text-sm text-muted-foreground">
        La carte n&apos;est pas disponible pour le moment. Toutes les informations restent dans la
        liste.
      </p>
    );
  }
  if (!style.data || !emprise) {
    return <div aria-hidden="true" className="h-full bg-map-land" />;
  }

  return (
    <div
      role="region"
      aria-label={gare ? `Carte autour de la gare de ${gare.nom}` : 'Carte du lieu'}
      className="relative h-full overflow-hidden bg-map-land"
    >
      <div className="absolute inset-0 isolate">
        <Map
          ref={carte}
          mapStyle={style.data.style as StyleSpecification}
          initialViewState={{
            bounds: emprise,
            fitBoundsOptions: { padding: MARGE_PX, maxZoom: zoomMaxFiche },
          }}
          attributionControl={false}
          onClick={() => surChoix(null)}
        >
          <MarqueursLieux lieux={lieux} cleChoisie={cleChoisie} surChoix={surChoix} />
          {gare && <MarqueurGareDepart gare={gare} />}
        </Map>
      </div>

      {/* Attribution exigée par la licence, toujours visible (config/sources.json). */}
      <p className="absolute inset-x-0 bottom-0 bg-surface/80 px-2 py-0.5 text-2xs text-muted-foreground">
        <AttributionFondCarte />
      </p>

      {choisi && lienDe && (
        <Link
          href={lienDe(choisi.cle)}
          aria-label={`Ouvrir la fiche de ${choisi.nom}`}
          className="absolute inset-x-3 bottom-8 flex h-(--pilule-carte-hauteur) items-center justify-between gap-2 rounded-pill bg-carte-sur-marque-bg pr-2.5 pl-5 text-carte-sur-marque-texte shadow-float lg:right-auto lg:w-96"
        >
          <span className="min-w-0 truncate text-md font-bold">{choisi.nom}</span>
          <span
            aria-hidden="true"
            className="flex size-(--pilule-carte-rond) flex-none items-center justify-center rounded-pill bg-sortie-bg text-sortie-foreground"
          >
            <ArrowRight className="size-5" />
          </span>
        </Link>
      )}
    </div>
  );
}
