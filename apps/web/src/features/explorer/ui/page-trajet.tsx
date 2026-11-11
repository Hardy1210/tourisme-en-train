'use client';

// Page « Trajet » du téléphone (D085) : départ et destination dans une page plein écran, à la place des
// feuilles « D'où partez-vous ? » et « Où allez-vous ? », que le clavier de l'iPhone bousculait. Toujours
// montée (même quand le départ se recharge) ; ouverte dans le toucher par `usePageTrajet().ouvrir`.
import { useCallback, useRef, useState } from 'react';

import { PagePleinEcran } from '@/components/ui/page-plein-ecran';
import type { Destination } from '@/features/destinations/schemas';

import { TEXTES_TRAJET } from '../contenu-trajet';
import { apresChoix } from '../enchainement-trajet';
import { FILTRES_PAR_DEFAUT, type Filtres } from '../filtres';
import type { useChoixDepart } from '../hooks';
import type { Recherche } from '../recherche-destination';
import type { PageTrajetEtat } from '../use-page-trajet';
import { ChampsTrajet } from './champs-trajet';
import { ZoneDepart } from './zone-depart';
import { ZoneDestination } from './zone-destination';

type Proprietes = {
  trajet: PageTrajetEtat;
  choix: ReturnType<typeof useChoixDepart>;
  filtres: Filtres;
  surModification: (modifications: Partial<Filtres>) => void;
  /** Après une recherche : la feuille de résultats monte au plus haut et montre la destination. */
  surResultats: () => void;
};

export function PageTrajet({ trajet, choix, filtres, surModification, surResultats }: Proprietes) {
  const { depart } = choix;
  const [texteDepart, setTexteDepart] = useState('');
  // null : rien tapé depuis l'ouverture, le champ montre la recherche en cours.
  const [saisieDestination, setSaisieDestination] = useState<string | null>(null);
  const [verifierDepuis, setVerifierDepuis] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Choix en attente : appliqué une fois le fondu terminé (le filtrage bloquerait l'animation).
  const enAttente = useRef<Recherche | null>(null);
  const texteDestination = saisieDestination ?? filtres.recherche;
  const { setOuverte } = trajet;

  const fermer = useCallback(
    (recherche: Recherche | null) => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      enAttente.current = recherche;
      setOuverte(false);
    },
    [setOuverte],
  );
  const apresFermeture = () => {
    setTexteDepart('');
    setSaisieDestination(null);
    setVerifierDepuis(null);
    setMessage(null);
    const recherche = enAttente.current;
    enAttente.current = null;
    if (recherche) {
      surModification(recherche);
      surResultats();
    }
  };

  // Un départ choisi : le curseur passe à la destination si elle est vide ; sinon, on vérifie qu'elle
  // a encore un train direct depuis le nouveau départ avant de fermer.
  const apresDepart = (changer: () => void, memeDepart: boolean) => {
    const destinationRemplie = filtres.recherche.trim() !== '';
    const suite = apresChoix({ champ: 'depart', departRempli: true, destinationRemplie });
    setTexteDepart('');
    setMessage(null);
    if (suite.action === 'champ') trajet.allerA(suite.champ);
    else if (memeDepart) fermer(null);
    else {
      trajet.allerA('destination');
      if (depart.etat === 'pret') setVerifierDepuis(depart.gare.uic);
    }
    changer();
  };
  const nomDestination = filtres.recherche;
  const surVerification = useCallback(
    (possible: boolean) => {
      setVerifierDepuis(null);
      if (possible) return fermer(null);
      setMessage(
        TEXTES_TRAJET.impossible(depart.etat === 'pret' ? depart.gare.nom : '', nomDestination),
      );
      setSaisieDestination('');
      surModification({ recherche: '', destination: null });
    },
    [depart, fermer, nomDestination, surModification],
  );

  const choisirDestination = (destination: Destination) => {
    const recherche = { recherche: destination.titre, destination: destination.gare.uic };
    const suite = apresChoix({
      champ: 'destination',
      departRempli: depart.etat === 'pret',
      destinationRemplie: true,
    });
    if (suite.action === 'champ') {
      trajet.allerA(suite.champ);
      surModification(recherche);
    } else fermer(recherche);
  };
  const afficherTexte = () => {
    if (texteDestination.trim() !== '') fermer({ recherche: texteDestination, destination: null });
  };

  return (
    <PagePleinEcran
      ouverte={trajet.ouverte}
      page={trajet.page}
      titre={TEXTES_TRAJET.titrePage}
      libelleRetour={TEXTES_TRAJET.retour}
      surRetour={() => fermer(null)}
      apresFermeture={apresFermeture}
    >
      <div className="flex-none border-b border-border px-4 pt-1 pb-4">
        <ChampsTrajet
          actif={trajet.champActif}
          surActif={trajet.setChampActif}
          surEntree={() => trajet.champActif === 'destination' && afficherTexte()}
          depart={{
            valeur: texteDepart,
            indication: depart.etat === 'pret' ? choix.libelle : TEXTES_TRAJET.indicationDepart,
            ref: trajet.champs.depart,
            surSaisie: setTexteDepart,
          }}
          destination={{
            valeur: texteDestination,
            indication: TEXTES_TRAJET.indicationDestination,
            ref: trajet.champs.destination,
            surSaisie: (texte) => {
              setSaisieDestination(texte);
              setMessage(null);
            },
          }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6">
        {trajet.champActif === 'depart' ? (
          <ZoneDepart
            texte={texteDepart}
            choix={choix}
            surMaPosition={() =>
              apresDepart(
                choix.revenirAMaPosition,
                depart.etat === 'pret' && depart.origine === 'position',
              )
            }
            surGare={(uic) =>
              apresDepart(
                () => choix.choisirGareEtFermer(uic),
                depart.etat === 'pret' && depart.gare.uic === uic,
              )
            }
            surPoint={(point) => apresDepart(() => void choix.choisirPoint(point), false)}
          />
        ) : depart.etat === 'pret' ? (
          <ZoneDestination
            depart={depart}
            filtres={filtres}
            texte={texteDestination}
            verifierDepuis={verifierDepuis}
            surVerification={surVerification}
            message={message}
            surChoix={choisirDestination}
            surAfficher={afficherTexte}
            surVoirToutes={() => fermer({ recherche: '', destination: null })}
            surEffacerTexte={() => {
              setSaisieDestination('');
              trajet.allerA('destination');
            }}
            surEffacerFiltres={() => {
              const { categories, rayon, dureeMax, faisable } = FILTRES_PAR_DEFAUT;
              surModification({ categories, rayon, dureeMax, faisable });
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{TEXTES_TRAJET.chargement}</p>
        )}
      </div>
    </PagePleinEcran>
  );
}
