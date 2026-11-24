'use client';

// Écran 3a de l'accueil (D113, maquette « Accueil ») : la gare de départ, et une destination facultative.
// « Changer » et « Destination » ouvrent la page « Trajet » (téléphone) ou ses feuilles (ordinateur), déjà
// là : aucune deuxième recherche à écrire ni à tester.
import { ArrowRight, Flag, TrainFront } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { accesGareProche } from '@/features/gares/acces-gare';
import { presentationGare } from '../accueil';
import { TEXTES_ACCUEIL as T } from '../contenu-accueil';
import type { Depart } from '../depart';
import { TitreAccueil, TitreAccueilSimple } from './cadre-accueil';

type Proprietes = {
  /**
   * `chargement` le temps de trouver la gare (position demandée, ou gare choisie en route) : le cadre n'est
   * pas une fenêtre modale à ce moment-là (`CadreAccueil`), d'où le titre simple.
   */
  depart: Depart;
  surChanger: () => void;
  surDestination: () => void;
  surVoir: () => void;
};

export function AccueilGare({ depart, surChanger, surDestination, surVoir }: Proprietes) {
  const pret = depart.etat === 'pret' ? depart : null;
  const acces =
    pret && pret.gare.distanceM !== null
      ? accesGareProche(pret.gare.distanceM, pret.gare.parkingVelo)
      : null;

  const Titre = pret ? TitreAccueil : TitreAccueilSimple;

  return (
    <>
      <Titre
        titre={T.titreGare}
        texte={pret ? T.presentation[presentationGare(pret)] : T.rechercheGare}
      />
      <div className="flex min-h-19 items-center gap-3.5 rounded-carte bg-carte-sur-marque-bg p-3.5">
        <span className="flex size-12 flex-none items-center justify-center rounded-lg bg-sortie-bg text-sortie-foreground">
          <TrainFront aria-hidden="true" className="size-6" />
        </span>
        {pret ? (
          <>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-lg font-bold">{pret.gare.nom}</span>
              {acces && (
                <span className="text-sm text-page-marque-texte-muted">
                  {acces.texte}
                  {acces.distance && ` · ${acces.distance}`}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={surChanger}
              aria-label={T.changerGare(pret.gare.nom)}
              className="min-h-touch cursor-pointer px-1 text-md font-semibold underline underline-offset-3"
            >
              {T.changer}
            </button>
          </>
        ) : (
          <span className="text-base text-page-marque-texte-muted">{T.rechercheGare}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-page-marque-texte-muted">
          {T.dejaUneIdee} {T.facultatif}
        </span>
        <button
          type="button"
          disabled={!pret}
          onClick={surDestination}
          className="flex h-13 cursor-pointer items-center gap-2.5 rounded-champ bg-champ-bg px-4 text-left text-base text-muted-foreground disabled:cursor-not-allowed"
        >
          <Flag aria-hidden="true" className="size-5 flex-none" />
          {T.destination}
        </button>
      </div>

      <Bouton
        variante="sortie"
        className="h-13 text-lg font-bold"
        disabled={!pret}
        onClick={surVoir}
      >
        {T.voirSorties}
        <ArrowRight aria-hidden="true" className="size-4.5" />
      </Bouton>
    </>
  );
}
