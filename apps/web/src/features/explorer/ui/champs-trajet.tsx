'use client';

// Les deux champs de la page « Trajet » (D085), reliés par la ligne du logo : anneau devant le départ,
// point plein devant la destination. Le champ actif est entouré de la couleur principale.
import { X } from 'lucide-react';
import type { RefObject } from 'react';

import { cn } from '@/lib/classes';

import { TEXTES_TRAJET } from '../contenu-trajet';
import type { ChampTrajet } from '../enchainement-trajet';

type Champ = {
  valeur: string;
  indication: string;
  ref: RefObject<HTMLInputElement | null>;
  surSaisie: (texte: string) => void;
};

type Proprietes = {
  depart: Champ;
  destination: Champ;
  actif: ChampTrajet;
  surActif: (champ: ChampTrajet) => void;
  surEntree: () => void;
};

export function ChampsTrajet({ depart, destination, actif, surActif, surEntree }: Proprietes) {
  const champ = (nom: ChampTrajet, { valeur, indication, ref, surSaisie }: Champ) => (
    // Le ✕ reste hors du <label> : sinon son nom s'ajoute à celui du champ (« Destination Effacer… »).
    <div
      className={cn(
        'flex h-13 items-center gap-2 rounded-champ bg-champ-bg px-3.5',
        actif === nom && 'outline-2 outline-primary',
      )}
    >
      <label className="flex min-w-0 flex-1 items-center">
        <span className="sr-only">
          {nom === 'depart' ? TEXTES_TRAJET.champDepart : TEXTES_TRAJET.champDestination}
        </span>
        {/* 16 px minimum : en dessous, iOS zoome sur la page à la saisie. */}
        <input
          ref={ref}
          type="search"
          value={valeur}
          placeholder={indication}
          onFocus={() => surActif(nom)}
          onChange={(evenement) => surSaisie(evenement.target.value)}
          onKeyDown={(evenement) => {
            if (evenement.key === 'Enter') surEntree();
          }}
          enterKeyHint="search"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
      </label>
      {valeur !== '' && (
        <button
          type="button"
          aria-label={TEXTES_TRAJET.effacerChamp}
          onClick={() => {
            surSaisie('');
            ref.current?.focus({ preventScroll: true });
          }}
          className="-mr-2 flex size-touch flex-none cursor-pointer items-center justify-center text-muted-foreground"
        >
          <X aria-hidden="true" className="size-4.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex gap-3">
      <div aria-hidden="true" className="flex w-3 flex-none flex-col items-center py-5">
        <span className="size-3 flex-none rounded-pill border-2 border-primary" />
        <span className="w-0.5 flex-1 bg-primary" />
        <span className="size-3 flex-none rounded-pill bg-primary" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {champ('depart', depart)}
        {champ('destination', destination)}
      </div>
    </div>
  );
}
