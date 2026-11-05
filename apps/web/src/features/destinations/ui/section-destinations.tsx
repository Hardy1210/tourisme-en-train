import { Route } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import type { DestinationAffichee } from '../presentation';
import type { Destination } from '../schemas';
import { CarteDestination } from './carte-destination';
import { LegendeTemps } from './legende-temps';

type Proprietes = {
  gareNom: string;
  destinations: readonly DestinationAffichee[] | undefined;
  chargement: boolean;
  /** Message d'erreur à montrer (ex. date hors des horaires) ; null sinon. */
  erreur: string | null;
  lienDe: (destination: Destination) => string;
  survolee: string | null;
  surSurvol: (uic: string | null) => void;
  surReessai: () => void;
  /** La date est hors des horaires : réessayer ne servirait à rien, on propose d'en changer. */
  surAujourdhui: (() => void) | null;
  /** « Élargir à 1 h de train » ; null si la durée est déjà la plus grande. */
  elargir: { libelle: string; action: () => void } | null;
  surEffacer: () => void;
};

export function SectionDestinations({
  gareNom,
  destinations,
  chargement,
  erreur,
  lienDe,
  survolee,
  surSurvol,
  surReessai,
  surAujourdhui,
  elargir,
  surEffacer,
}: Proprietes) {
  const nombre = destinations?.length ?? 0;
  return (
    <section aria-labelledby="en-train-direct" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id="en-train-direct" className="text-xl font-bold">
          En train direct depuis {gareNom}
        </h2>
        {destinations !== undefined && (
          <p className="tabular text-sm text-muted-foreground">
            {nombre === 0
              ? 'Aucune destination'
              : `${nombre} destination${nombre > 1 ? 's' : ''} · triées par temps de trajet`}
          </p>
        )}
        <LegendeTemps />
      </div>

      {chargement && (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Squelette className="h-64 rounded-carte" />
          <Squelette className="h-64 rounded-carte" />
        </div>
      )}

      {erreur !== null && (
        <EtatVide titre="Ces trains n'ont pas pu être chargés" texte={erreur}>
          {surAujourdhui ? (
            <Bouton onClick={surAujourdhui}>Revenir à aujourd&apos;hui</Bouton>
          ) : (
            <Bouton variante="secondaire" onClick={surReessai}>
              Réessayer
            </Bouton>
          )}
        </EtatVide>
      )}

      {destinations?.length === 0 && (
        <EtatVide
          mention={
            <span className="flex size-12 items-center justify-center rounded-pill bg-primary-soft">
              <Route aria-hidden="true" className="size-5.5 text-primary" />
            </span>
          }
          titre="Pas de sortie en train direct pour ces envies"
          texte="Rien ne correspond pour cette date. Essayez une durée plus longue ou d'autres envies."
        >
          {elargir && <Bouton onClick={elargir.action}>{elargir.libelle}</Bouton>}
          <Bouton variante="secondaire" onClick={surEffacer}>
            Effacer les filtres
          </Bouton>
        </EtatVide>
      )}

      {destinations !== undefined && destinations.length > 0 && (
        <div className="relative flex flex-col gap-3.5 pl-7">
          <span
            aria-hidden="true"
            className="absolute top-2.5 bottom-10 left-2 w-0.75 rounded-pill bg-primary"
          />
          <p className="relative flex h-5.5 items-center text-sm font-semibold text-primary">
            <span
              aria-hidden="true"
              className="absolute top-1 -left-6.75 size-3.75 rounded-pill bg-primary"
            />
            {gareNom} · départ
          </p>
          {destinations.map((destination) => (
            <CarteDestination
              key={destination.gare.uic}
              destination={destination}
              lien={lienDe(destination)}
              survolee={survolee === destination.gare.uic}
              surSurvol={surSurvol}
            />
          ))}
        </div>
      )}
    </section>
  );
}
