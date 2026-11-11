'use client';

// Barre du trajet d'Explorer (D084) : « 📍 Autour de Dijon → Où aller ? », toujours sur UNE ligne. Si la
// place manque, le départ est coupé (« … ») ; la destination, qu'on vient de choisir, reste entière.
import { ArrowRight, MapPin, X } from 'lucide-react';

import { cn } from '@/lib/classes';

import { TEXTES_TRAJET } from '../contenu-trajet';

type Proprietes = {
  depart: string;
  destination: { texte: string; active: boolean };
  surDepart: () => void;
  surDestination: () => void;
  surEffacer: () => void;
};

const CLASSES_PARTIE =
  'flex h-full min-w-0 cursor-pointer items-center gap-2 rounded-bouton px-3 text-base hover:bg-surface-sunken';

export function BarreTrajet({
  depart,
  destination,
  surDepart,
  surDestination,
  surEffacer,
}: Proprietes) {
  return (
    <div
      role="group"
      aria-label={TEXTES_TRAJET.trajet(depart, destination.texte)}
      className="flex h-touch w-full items-center rounded-bouton bg-surface shadow-xs"
    >
      <button
        type="button"
        onClick={surDepart}
        aria-label={TEXTES_TRAJET.modifierDepart(depart)}
        className={cn(CLASSES_PARTIE, 'flex-1')}
      >
        <MapPin aria-hidden="true" className="size-4.5 flex-none text-primary" />
        <span className="min-w-0 flex-1 truncate text-left">{depart}</span>
      </button>
      <ArrowRight aria-hidden="true" className="size-4 flex-none text-muted-foreground" />
      <button
        type="button"
        onClick={surDestination}
        aria-label={TEXTES_TRAJET.modifierDestination(destination.texte)}
        className={cn(
          CLASSES_PARTIE,
          'max-w-3/5 flex-none',
          destination.active ? 'font-semibold text-foreground' : 'text-primary',
        )}
      >
        <span className="truncate">{destination.texte}</span>
      </button>
      {destination.active && (
        <button
          type="button"
          onClick={surEffacer}
          aria-label={TEXTES_TRAJET.effacer}
          className="flex size-touch flex-none cursor-pointer items-center justify-center rounded-bouton text-muted-foreground hover:bg-surface-sunken"
        >
          <X aria-hidden="true" className="size-4.5" />
        </button>
      )}
    </div>
  );
}
