'use client';

// Barre du trajet d'Explorer (D084) : « 📍 Autour de Dijon → Où aller ? », sur UNE ligne tant qu'aucune
// destination n'est cherchée. Si la place manque, le départ est coupé (« … »), la destination reste entière.
// Destination cherchée dans la page « Trajet » (touchée ou texte tapé) : DEUX lignes (D115, maquette
// « Explorer », état 2), « ○ Départ  Dijon » puis « ● Arrivée  Beaune », reliées comme dans la page
// « Trajet », et le ✕ à droite. Les noms pour les lecteurs d'écran ne changent pas.
import { ArrowRight, MapPin, X } from 'lucide-react';

import { cn } from '@/lib/classes';

import { TEXTES_TRAJET } from '../contenu-trajet';

type Proprietes = {
  /** « Autour de Dijon », « Au départ de Beaune » : une ligne, et noms accessibles. */
  depart: string;
  /** « Dijon », « Beaune » : deux lignes (D115). */
  departCourt: string;
  destination: { texte: string; active: boolean };
  surDepart: () => void;
  surDestination: () => void;
  surEffacer: () => void;
};

const CLASSES_PARTIE =
  'flex h-full min-w-0 cursor-pointer items-center gap-2 rounded-bouton px-3 text-base hover:bg-surface-sunken';
const CLASSES_LIGNE =
  'flex h-11.5 min-w-0 cursor-pointer items-center gap-2.5 px-3.5 text-left text-base hover:bg-surface-sunken';
const CLASSES_ETIQUETTE = 'w-12.5 flex-none text-xs font-medium text-muted-foreground';

export function BarreTrajet({
  depart,
  departCourt,
  destination,
  surDepart,
  surDestination,
  surEffacer,
}: Proprietes) {
  const effacer = (
    <button
      type="button"
      onClick={surEffacer}
      aria-label={TEXTES_TRAJET.effacer}
      className="flex size-touch flex-none cursor-pointer items-center justify-center rounded-bouton text-muted-foreground hover:bg-surface-sunken"
    >
      <X aria-hidden="true" className="size-4.5" />
    </button>
  );

  if (destination.active) {
    return (
      <div
        role="group"
        aria-label={TEXTES_TRAJET.trajet(depart, destination.texte)}
        className="flex w-full items-center overflow-hidden rounded-bouton bg-surface shadow-xs"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <button
            type="button"
            onClick={surDepart}
            aria-label={TEXTES_TRAJET.modifierDepart(depart)}
            className={cn(CLASSES_LIGNE, 'font-medium')}
          >
            <span
              aria-hidden="true"
              className="size-2.5 flex-none rounded-pill border-2 border-primary"
            />
            <span className={CLASSES_ETIQUETTE}>{TEXTES_TRAJET.etiquetteDepart}</span>
            <span className="min-w-0 flex-1 truncate">{departCourt}</span>
          </button>
          <span aria-hidden="true" className="ml-9.5 h-px bg-border" />
          <button
            type="button"
            onClick={surDestination}
            aria-label={TEXTES_TRAJET.modifierDestination(destination.texte)}
            className={cn(CLASSES_LIGNE, 'font-semibold')}
          >
            <span aria-hidden="true" className="size-2.5 flex-none rounded-pill bg-primary" />
            <span className={CLASSES_ETIQUETTE}>{TEXTES_TRAJET.etiquetteArrivee}</span>
            <span className="min-w-0 flex-1 truncate">{destination.texte}</span>
          </button>
        </div>
        <div className="flex-none pr-1">{effacer}</div>
      </div>
    );
  }

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
        className={cn(CLASSES_PARTIE, 'max-w-3/5 flex-none text-primary')}
      >
        <span className="truncate">{destination.texte}</span>
      </button>
    </div>
  );
}
