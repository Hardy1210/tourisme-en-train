'use client';

// Page « Trajet » du téléphone (D085) : départ et destination dans une page plein écran, à la place des
// feuilles « D'où partez-vous ? » et « Où allez-vous ? », que le clavier de l'iPhone bousculait. Toujours
// montée (même quand le départ se recharge) ; ouverte dans le toucher par `usePageTrajet().ouvrir`.
// Mise en page seulement : la logique est dans `use-saisie-trajet.ts`.
import { dateDuJour } from '@tourisme/commun';

import { ATTRIBUT_DEFILEMENT, PagePleinEcran } from '@/components/ui/page-plein-ecran';

import { TEXTES_TRAJET } from '../contenu-trajet';
import { attenteDestination } from '../depart';
import { ligneDate } from '../date';
import { FILTRES_PAR_DEFAUT, type Filtres } from '../filtres';
import type { useChoixDepart } from '../hooks';
import type { PageTrajetEtat } from '../use-page-trajet';
import { useSaisieTrajet } from '../use-saisie-trajet';
import { ChampsTrajet } from './champs-trajet';
import { PastillesDateTrajet, ZoneDateTrajet } from './date-trajet';
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
  const saisie = useSaisieTrajet({ trajet, choix, filtres, surModification, surResultats });

  return (
    <PagePleinEcran
      ouverte={trajet.ouverte}
      page={trajet.page}
      titre={TEXTES_TRAJET.titrePage}
      libelleRetour={TEXTES_TRAJET.retour}
      surRetour={() => saisie.fermer(null)}
      apresFermeture={saisie.apresFermeture}
    >
      <div className="flex-none border-b border-border px-4 pt-1 pb-4">
        <ChampsTrajet
          actif={trajet.champActif}
          surActif={trajet.setChampActif}
          surEntree={() => trajet.champActif === 'destination' && saisie.afficherTexte()}
          depart={{
            valeur: saisie.texteDepart,
            indication: depart.etat === 'pret' ? choix.libelle : TEXTES_TRAJET.indicationDepart,
            ref: trajet.champs.depart,
            surSaisie: saisie.saisirDepart,
          }}
          destination={{
            valeur: saisie.texteDestination,
            indication: TEXTES_TRAJET.indicationDestination,
            ref: trajet.champs.destination,
            surSaisie: saisie.saisirDestination,
          }}
          // D116 : la date de la sortie, la même que dans « Filtres ». Page fermée (toujours montée,
          // inerte) : ni ligne ni pastilles, aucun bouton caché en double sur l'écran.
          surInverser={saisie.visible && saisie.peutInverser ? saisie.inverser : undefined}
          date={
            saisie.visible
              ? { ...ligneDate(filtres.date, dateDuJour()), surToucher: trajet.allerALaDate }
              : undefined
          }
        />
        {/* Les pastilles quand Destination ou Date est actif, pas pour le départ (D116). */}
        {saisie.visible && trajet.champActif !== 'depart' && (
          <div className="mt-3 pl-6">
            <PastillesDateTrajet />
          </div>
        )}
      </div>
      <div
        {...{ [ATTRIBUT_DEFILEMENT]: '' }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6"
      >
        {/* Fermée : seuls les champs restent, pour prendre la main dans le toucher qui l'ouvre. */}
        {!saisie.visible ? null : trajet.champActif === 'date' ? (
          <ZoneDateTrajet surChoisie={() => trajet.allerA('destination')} />
        ) : trajet.champActif === 'depart' ? (
          <ZoneDepart
            texte={saisie.texteDepart}
            choix={choix}
            surMaPosition={() =>
              saisie.apresDepart(
                choix.revenirAMaPosition,
                depart.etat === 'pret' && depart.origine === 'position',
              )
            }
            surGare={(uic) =>
              saisie.apresDepart(
                () => choix.choisirGareEtFermer(uic),
                depart.etat === 'pret' && depart.gare.uic === uic,
              )
            }
            surPoint={(point) => saisie.apresDepart(() => void choix.choisirPoint(point), false)}
          />
        ) : depart.etat === 'pret' ? (
          <ZoneDestination
            depart={depart}
            filtres={filtres}
            texte={saisie.texteDestination}
            message={saisie.message}
            surChoix={saisie.choisirDestination}
            surAfficher={saisie.afficherTexte}
            surVoirToutes={() => saisie.fermer({ recherche: '', destination: null })}
            surEffacerTexte={saisie.effacerDestination}
            surEffacerFiltres={() => {
              const { categories, rayon, dureeMax, faisable } = FILTRES_PAR_DEFAUT;
              surModification({ categories, rayon, dureeMax, faisable });
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {TEXTES_TRAJET[attenteDestination(depart.etat)]}
          </p>
        )}
      </div>
    </PagePleinEcran>
  );
}
