'use client';

import { LocateFixed, MapPinOff, TrainFront } from 'lucide-react';
import { Bandeau } from '@/components/ui/bandeau';
import { Bouton } from '@/components/ui/bouton';
import { Puce } from '@/components/ui/puce';
import { parametres } from '@/config/parametres';
import { RechercheVille } from './recherche-ville';

const MESSAGES = {
  refusee:
    "Sans votre position, dites-nous d'où vous partez. On vous montre aussitôt les sorties et les trains autour.",
  indisponible:
    "Votre position n'a pas pu être trouvée. Dites-nous d'où vous partez, on vous montre aussitôt les sorties et les trains autour.",
  gare_inconnue:
    "Cette gare n'existe pas ou plus. Dites-nous d'où vous partez, on vous montre aussitôt les sorties et les trains autour.",
} as const;

type Proprietes = {
  raison: keyof typeof MESSAGES;
  /** Une nouvelle demande a déjà été refusée : le navigateur ne redemandera plus. */
  bloquee: boolean;
  surChoixPoint: (point: { lat: number; lon: number }) => void;
  surChoixGare: (uic: string) => void;
  surRedemande: () => void;
};

export function EcranSansPosition({
  raison,
  bloquee,
  surChoixPoint,
  surChoixGare,
  surRedemande,
}: Proprietes) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <span className="flex size-14 items-center justify-center rounded-carte bg-primary-soft">
        <MapPinOff aria-hidden="true" className="size-7 text-primary" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Dans quelle ville êtes-vous ?</h1>
        <p className="text-base text-pretty text-muted-foreground">{MESSAGES[raison]}</p>
      </div>
      <RechercheVille surChoix={surChoixPoint} indication="Nom de ville ou de gare" />
      <div className="flex flex-col gap-2.5">
        <span className="text-sm text-muted-foreground">Suggestions</span>
        <div className="flex flex-wrap gap-2">
          {parametres.region.garesPrincipales.slice(0, 3).map((gare) => (
            <Puce
              key={gare.uic}
              selectionnee={false}
              icone={<TrainFront aria-hidden="true" className="text-primary" />}
              onClick={() => surChoixGare(gare.uic)}
            >
              {gare.ville}
            </Puce>
          ))}
        </div>
      </div>
      {bloquee && (
        <Bandeau variante="info">
          La localisation est bloquée : autorisez-la dans les réglages de votre navigateur.
        </Bandeau>
      )}
      <Bouton variante="fantome" className="text-primary" onClick={surRedemande}>
        <LocateFixed aria-hidden="true" className="size-4.5" />
        Autoriser la localisation
      </Bouton>
    </div>
  );
}
