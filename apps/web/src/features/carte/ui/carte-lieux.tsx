'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowRight } from 'lucide-react';
import type { StyleSpecification } from 'maplibre-gl';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import { Bouton, BoutonFermer } from '@/components/ui/bouton';
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
      className="relative h-full overflow-hidden"
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
        <div className="absolute inset-x-3 bottom-8 flex items-center justify-between gap-2 rounded-lg bg-surface-raised py-1 pr-1 pl-3 shadow-float lg:right-auto lg:w-96">
          <h3 className="min-w-0 truncate text-md font-bold">{choisi.nom}</h3>
          <div className="flex flex-none items-center">
            <Bouton variante="sortie" asChild>
              <Link href={lienDe(choisi.cle)}>
                Voir
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Bouton>
            <BoutonFermer onClick={() => surChoix(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
