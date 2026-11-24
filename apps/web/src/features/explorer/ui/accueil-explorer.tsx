'use client';

// L'accueil du premier lancement par-dessus Explorer (D113) : écran 1, puis écran 3a. Il ne fait qu'appeler
// les fonctions de départ et de trajet d'Explorer : aucun état du trajet à lui.
import { flushSync } from 'react-dom';
import type { EtapeAccueil } from '../accueil';
import type { useChoixDepart } from '../hooks';
import type { Accueil } from '../use-accueil';
import { AccueilBienvenue } from './accueil-bienvenue';
import { AccueilGare } from './accueil-gare';
import { CadreAccueil } from './cadre-accueil';

type Proprietes = {
  accueil: Accueil;
  etape: Exclude<EtapeAccueil, null>;
  choix: ReturnType<typeof useChoixDepart>;
  /** Page « Trajet » (téléphone) ou feuille (ordinateur), sur le champ Départ. */
  ouvrirDepart: () => void;
  /** Page « Trajet » (téléphone) ou feuille « Où allez-vous ? » (ordinateur). */
  ouvrirDestination: () => void;
};

export function AccueilExplorer({
  accueil,
  etape,
  choix,
  ouvrirDepart,
  ouvrirDestination,
}: Proprietes) {
  // La fenêtre de l'accueil se ferme tout de suite (`flushSync`), dans le même toucher : sinon elle reprend
  // le focus au champ de la page « Trajet », et le clavier de l'iPhone ne s'ouvre pas.
  const quitterVers = (ouvrir: () => void) => {
    flushSync(accueil.terminer);
    ouvrir();
  };

  return (
    // Le même cadre pour les deux écrans : la photo ne change pas en cours de route.
    <CadreAccueil>
      {etape === 'bienvenue' ? (
        <AccueilBienvenue choix={choix} surChoix={accueil.choisir} />
      ) : (
        <AccueilGare
          depart={choix.depart}
          surChanger={() => quitterVers(ouvrirDepart)}
          surDestination={() => quitterVers(ouvrirDestination)}
          surVoir={accueil.terminer}
        />
      )}
    </CadreAccueil>
  );
}
