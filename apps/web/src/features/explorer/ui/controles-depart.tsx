'use client';

import { dateDuJour } from '@tourisme/commun';
import { CalendarDays, ChevronDown, MapPin } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { Bandeau } from '@/components/ui/bandeau';
import { Squelette } from '@/components/ui/squelette';
import { EcranHorsRegion } from '@/features/localisation/ui/ecran-hors-region';
import { EcranSansPosition } from '@/features/localisation/ui/ecran-sans-position';
import { FeuilleDepart } from '@/features/localisation/ui/feuille-depart';
import { libelleDate } from '../date';
import type { useChoixDepart } from '../hooks';

type Choix = ReturnType<typeof useChoixDepart>;

export function BoutonDate({ date, surClic }: { date: string | null; surClic: () => void }) {
  return (
    <Bouton
      variante="secondaire"
      className="rounded-pill border-border px-3 font-medium"
      onClick={surClic}
    >
      <CalendarDays aria-hidden="true" className="size-4.5 text-primary" />
      {libelleDate(date, dateDuJour())}
      <ChevronDown aria-hidden="true" className="size-4 text-primary" />
    </Bouton>
  );
}

/** Bouton « Autour de… » de l'en-tête. */
export function BoutonDepart({ choix }: { choix: Choix }) {
  return (
    <Bouton
      variante="secondaire"
      className="w-full justify-start border-0 bg-surface text-base font-normal shadow-xs"
      onClick={() => choix.setFeuilleOuverte(true)}
    >
      <MapPin aria-hidden="true" className="size-4.5 flex-none text-primary" />
      <span className="min-w-0 flex-1 truncate text-left">{choix.libelle}</span>
      <ChevronDown aria-hidden="true" className="size-4 flex-none text-primary" />
    </Bouton>
  );
}

/** Le choix d'une ville n'a donné aucune gare. */
export function ErreurChoixDepart({ choix }: { choix: Choix }) {
  if (!choix.erreurChoix) return null;
  return (
    <Bandeau variante="danger">Aucune gare trouvée pour ce choix. Essayez une autre ville.</Bandeau>
  );
}

/** Tout ce qui s'affiche tant que la gare de départ n'est pas connue. */
export function EtatsDepart({ choix }: { choix: Choix }) {
  const { depart } = choix;
  return (
    <>
      {depart.etat === 'chargement' && (
        <div className="flex flex-col gap-3 p-4">
          <Bandeau variante="neutre">On cherche ce qu&apos;il y a autour de vous…</Bandeau>
          <Squelette className="h-36 rounded-carte" />
        </div>
      )}

      {depart.etat === 'sans_position' && (
        <EcranSansPosition
          raison={depart.raison}
          bloquee={depart.raison === 'refusee' && choix.essais > 0}
          surChoixPoint={choix.choisirPoint}
          surChoixGare={choix.choisirGareEtFermer}
          surRedemande={choix.revenirAMaPosition}
        />
      )}

      {depart.etat === 'hors_region' && (
        <EcranHorsRegion
          surChoixGare={choix.choisirGareEtFermer}
          surRecherche={() => choix.setFeuilleOuverte(true)}
        />
      )}

      {depart.etat === 'erreur' && (
        <div className="p-4">
          <EtatVide
            titre="Un problème est survenu"
            texte="Nous n'avons pas pu trouver votre gare. Réessayez dans un instant."
          >
            <Bouton variante="secondaire" onClick={choix.revenirAMaPosition}>
              Réessayer
            </Bouton>
          </EtatVide>
        </div>
      )}
    </>
  );
}

export function FeuilleChoixDepart({ choix }: { choix: Choix }) {
  const { depart } = choix;
  return (
    <FeuilleDepart
      ouverte={choix.feuilleOuverte}
      surChangement={choix.setFeuilleOuverte}
      proches={depart.etat === 'pret' ? depart.proches : []}
      uicActuel={depart.etat === 'pret' ? depart.gare.uic : null}
      surMaPosition={() => {
        choix.setFeuilleOuverte(false);
        choix.revenirAMaPosition();
      }}
      surChoixGare={choix.choisirGareEtFermer}
      surChoixPoint={choix.choisirPoint}
    />
  );
}
