'use client';

// Logique de la page « Trajet » (D085, remise en ordre le 24/11) : l'état de la saisie (réducteur pur,
// `saisie-trajet.ts`), la fermeture en fondu, et la vérification « reste-t-il un train direct ? »,
// calculée ici à partir de la liste, au lieu d'allers-retours entre la page et la zone du bas.
// La page n'a plus que de la mise en page.
import { useCallback, useEffect, useEffectEvent, useReducer, useRef, useState } from 'react';
import type { Destination } from '@/features/destinations/schemas';
import { TEXTES_TRAJET } from './contenu-trajet';
import { apresChoix } from './enchainement-trajet';
import type { Filtres } from './filtres';
import type { useChoixDepart } from './hooks';
import { useListeDestinations } from './liste-destinations';
import type { Recherche } from './recherche-destination';
import {
  resultatInversion,
  resultatVerification,
  SAISIE_VIDE,
  saisieTrajet,
} from './saisie-trajet';
import type { PageTrajetEtat } from './use-page-trajet';

type Options = {
  trajet: PageTrajetEtat;
  choix: ReturnType<typeof useChoixDepart>;
  filtres: Filtres;
  surModification: (modifications: Partial<Filtres>) => void;
  /** Après une recherche : la feuille de résultats monte au plus haut et montre la destination. */
  surResultats: () => void;
};

export function useSaisieTrajet({
  trajet,
  choix,
  filtres,
  surModification,
  surResultats,
}: Options) {
  const { depart } = choix;
  const [saisie, envoyer] = useReducer(saisieTrajet, SAISIE_VIDE);
  // Fondu de fermeture en cours : le contenu reste affiché jusqu'à la fin.
  const [enFondu, setEnFondu] = useState(false);
  // Choix en attente : appliqué une fois le fondu terminé (le filtrage bloquerait l'animation).
  const enAttente = useRef<Recherche | null>(null);
  const { setOuverte } = trajet;

  const fermer = useCallback(
    (recherche: Recherche | null) => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      enAttente.current = recherche;
      setEnFondu(true);
      setOuverte(false);
    },
    [setOuverte],
  );
  const apresFermeture = () => {
    setEnFondu(false);
    envoyer({ type: 'reinitialiser' });
    const recherche = enAttente.current;
    enAttente.current = null;
    if (recherche) {
      surModification(recherche);
      surResultats();
    }
  };

  // Vérification après un changement de départ : la même requête que la liste d'Explorer (cache).
  const gareActuelle = depart.etat === 'pret' ? depart.gare.uic : null;
  const { avantRecherche } = useListeDestinations(gareActuelle, filtres);
  const verification = resultatVerification({
    verifierDepuis: saisie.verifierDepuis,
    gareActuelle,
    liste: avantRecherche,
    recherche: filtres,
  });
  // ⇅ (D117) : l'ancien départ, retrouvé dans la liste du nouveau dès qu'elle est chargée.
  const inversion = resultatInversion({
    inversion: saisie.inversion,
    gareActuelle,
    liste: avantRecherche,
  });
  const nomDepart = depart.etat === 'pret' ? depart.gare.nom : '';
  const conclure = useEffectEvent(() => {
    if (inversion.etat === 'trouvee') {
      const { titre, gare } = inversion.destination;
      envoyer({ type: 'inversee' });
      surModification({ recherche: titre, destination: gare.uic });
    } else if (inversion.etat === 'impossible' && saisie.inversion) {
      envoyer({
        type: 'impossible',
        message: TEXTES_TRAJET.impossible(nomDepart, saisie.inversion.nom),
      });
      surModification({ recherche: '', destination: null });
    }
    if (verification === 'possible') {
      envoyer({ type: 'verifiee' });
      fermer(null);
    } else if (verification === 'impossible') {
      envoyer({
        type: 'impossible',
        message: TEXTES_TRAJET.impossible(nomDepart, filtres.recherche),
      });
      surModification({ recherche: '', destination: null });
    }
  });
  // Un vrai effet, pas un état dérivé : il répond à l'arrivée de la liste du nouveau départ en fermant la
  // page ou en changeant l'adresse (actions sur l'extérieur). Un seul endroit, plus d'aller-retour.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => conclure(), [verification, inversion.etat]);

  // Un départ choisi : le curseur passe à la destination si elle est vide ; sinon, on vérifie qu'elle
  // a encore un train direct depuis le nouveau départ avant de fermer.
  const apresDepart = (changer: () => void, memeDepart: boolean) => {
    const destinationRemplie = filtres.recherche.trim() !== '';
    const suite = apresChoix({ champ: 'depart', departRempli: true, destinationRemplie });
    const aReverifier = suite.action === 'fermer' && !memeDepart;
    envoyer({ type: 'departChoisi', verifierDepuis: aReverifier ? gareActuelle : null });
    if (suite.action === 'champ') trajet.allerA(suite.champ);
    else if (memeDepart) fermer(null);
    else trajet.allerA('destination');
    changer();
  };

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

  const texteDestination = saisie.saisieDestination ?? filtres.recherche;
  const afficherTexte = () => {
    if (texteDestination.trim() !== '') fermer({ recherche: texteDestination, destination: null });
  };

  return {
    texteDepart: saisie.texteDepart,
    texteDestination,
    message: saisie.message,
    /** Ouverte, ou en train de se refermer : sinon, seuls les champs restent (prendre la main au toucher). */
    visible: trajet.ouverte || enFondu,
    fermer,
    apresFermeture,
    apresDepart,
    choisirDestination,
    afficherTexte,
    saisirDepart: (texte: string) => envoyer({ type: 'saisirDepart', texte }),
    saisirDestination: (texte: string) => envoyer({ type: 'saisirDestination', texte }),
    /** ⇅ visible seulement avec une destination touchée dans la liste (un texte tapé n'est pas un lieu). */
    peutInverser: depart.etat === 'pret' && filtres.destination !== null,
    /** ⇅ : la gare de la destination devient le départ ; l'ancien départ, retrouvé, la destination. */
    inverser: () => {
      if (depart.etat !== 'pret' || filtres.destination === null) return;
      envoyer({ type: 'inverser', gareARetrouver: depart.gare.uic, nom: depart.gare.nom });
      choix.choisirGareEtFermer(filtres.destination);
    },
    effacerDestination: () => {
      envoyer({ type: 'effacerDestination' });
      trajet.allerA('destination');
    },
  };
}
