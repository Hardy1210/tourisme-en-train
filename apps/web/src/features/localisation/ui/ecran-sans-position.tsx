'use client';

// « Dans quelle ville êtes-vous ? » (maquette « Accueil », écran 2, D113) : position refusée ou introuvable,
// ou gare d'un lien disparue. Contenu seul, sur le fond de la marque : l'appelant le pose dans le cadre de
// l'accueil (plein écran dans Explorer, dans la page dans Lieux).
import { LocateFixed, TrainFront } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { parametres } from '@/config/parametres';
import { GuidageLocalisation } from './guidage-localisation';
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
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-pretty">
          Dans quelle ville êtes-vous ?
        </h1>
        <p className="text-base text-pretty text-page-marque-texte-muted">{MESSAGES[raison]}</p>
      </div>
      <RechercheVille surChoix={surChoixPoint} indication="Nom de ville ou de gare" surMarque />
      <div className="flex flex-col gap-2.5">
        <span id="suggestions-gares" className="text-sm text-page-marque-texte-muted">
          Suggestions
        </span>
        <div role="group" aria-labelledby="suggestions-gares" className="flex flex-wrap gap-2">
          {parametres.region.garesPrincipales.slice(0, 3).map((gare) => (
            <Bouton
              key={gare.uic}
              variante="sur-marque"
              className="gap-1.5 px-3.5 text-sm"
              onClick={() => surChoixGare(gare.uic)}
            >
              <TrainFront aria-hidden="true" className="size-4" />
              {gare.ville}
            </Bouton>
          ))}
        </div>
      </div>
      <Bouton
        variante="fantome-sur-marque"
        className="text-action-sur-marque"
        onClick={surRedemande}
      >
        <LocateFixed aria-hidden="true" className="size-4.5" />
        Autoriser la localisation
      </Bouton>
      <GuidageLocalisation bloquee={bloquee} surMarque />
    </>
  );
}
