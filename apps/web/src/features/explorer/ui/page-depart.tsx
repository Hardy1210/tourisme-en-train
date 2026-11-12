'use client';

// Page « D'où partez-vous ? » du téléphone, sur l'écran Lieux : la page « Trajet » d'Explorer (D085)
// réduite au champ Départ, à la place de la feuille que le clavier de l'iPhone bousculait. Toujours
// montée ; ouverte dans le toucher par `usePageTrajet().ouvrir('depart')`. Un départ choisi la ferme.
import { useState } from 'react';

import { ATTRIBUT_DEFILEMENT, PagePleinEcran } from '@/components/ui/page-plein-ecran';

import { TEXTES_TRAJET } from '../contenu-trajet';
import type { useChoixDepart } from '../hooks';
import type { PageTrajetEtat } from '../use-page-trajet';
import { ChampsTrajet } from './champs-trajet';
import { ZoneDepart } from './zone-depart';

type Proprietes = {
  trajet: PageTrajetEtat;
  choix: ReturnType<typeof useChoixDepart>;
};

export function PageDepart({ trajet, choix }: Proprietes) {
  const { depart } = choix;
  const [texte, setTexte] = useState('');
  // Fondu de fermeture en cours : le contenu reste affiché jusqu'à la fin.
  const [enFondu, setEnFondu] = useState(false);

  const fermer = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setEnFondu(true);
    trajet.setOuverte(false);
  };
  const choisir = (changer: () => void) => {
    fermer();
    changer();
  };

  return (
    <PagePleinEcran
      ouverte={trajet.ouverte}
      page={trajet.page}
      titre={TEXTES_TRAJET.titrePageDepart}
      libelleRetour={TEXTES_TRAJET.retour}
      surRetour={fermer}
      apresFermeture={() => {
        setEnFondu(false);
        setTexte('');
      }}
    >
      <div className="flex-none border-b border-border px-4 pt-1 pb-4">
        <ChampsTrajet
          actif="depart"
          surActif={() => {}}
          surEntree={() => {}}
          depart={{
            valeur: texte,
            indication: depart.etat === 'pret' ? choix.libelle : TEXTES_TRAJET.indicationDepart,
            ref: trajet.champs.depart,
            surSaisie: setTexte,
          }}
        />
      </div>
      <div
        {...{ [ATTRIBUT_DEFILEMENT]: '' }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6"
      >
        {/* Fermée : seul le champ reste, pour prendre la main dans le toucher qui l'ouvre. */}
        {(trajet.ouverte || enFondu) && (
          <ZoneDepart
            texte={texte}
            choix={choix}
            surMaPosition={() => choisir(choix.revenirAMaPosition)}
            surGare={(uic) => choisir(() => choix.choisirGareEtFermer(uic))}
            surPoint={(point) => choisir(() => void choix.choisirPoint(point))}
          />
        )}
      </div>
    </PagePleinEcran>
  );
}
