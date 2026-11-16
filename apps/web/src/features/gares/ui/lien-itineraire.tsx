'use client';

// « Voir l'itinéraire » (D096) : sur iPhone, une feuille pour choisir Plans ou Google Maps (iOS ne propose
// jamais ce choix lui-même) ; ailleurs, Google Maps directement. La gare seule en destination (règle 5).
import { ArrowUpRight, ChevronRight, Map as IconeCarte, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Feuille } from '@/components/ui/feuille';
import { useAppareil } from '@/features/localisation/ui/use-appareil';

import { lienItineraire } from '../acces-gare';

const CLASSES_LIEN =
  'flex items-center gap-0.5 text-sm font-medium whitespace-nowrap text-primary underline-offset-4 hover:underline';
const CLASSES_LIGNE =
  'flex min-h-14 w-full items-center gap-3 rounded-md px-1 text-left hover:bg-surface-sunken';

const APPLICATIONS = [
  { application: 'plans', nom: 'Plans', detail: 'Apple', Icone: IconeCarte },
  { application: 'google', nom: 'Google Maps', detail: 'Google', Icone: MapPin },
] as const;

export function LienItineraire({ gare }: { gare: { lat: number; lon: number } }) {
  const appareil = useAppareil();
  const [ouverte, setOuverte] = useState(false);

  if (!appareil.startsWith('iphone')) {
    return (
      <a
        href={lienItineraire(gare, 'google')}
        target="_blank"
        rel="noopener"
        className={CLASSES_LIEN}
      >
        Voir l’itinéraire
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </a>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOuverte(true)} className={CLASSES_LIEN}>
        Voir l’itinéraire
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </button>
      <Feuille ouverte={ouverte} surChangement={setOuverte} titre="Ouvrir l’itinéraire avec">
        <ul className="flex flex-col gap-1">
          {APPLICATIONS.map(({ application, nom, detail, Icone }) => (
            <li key={application}>
              <a
                href={lienItineraire(gare, application)}
                target="_blank"
                rel="noopener"
                onClick={() => setOuverte(false)}
                className={CLASSES_LIGNE}
              >
                <span className="flex size-touch flex-none items-center justify-center rounded-md bg-primary-soft">
                  <Icone aria-hidden="true" className="size-5.5 text-primary" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-medium">{nom}</span>
                  <span className="text-xs text-muted-foreground">{detail}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </Feuille>
    </>
  );
}
