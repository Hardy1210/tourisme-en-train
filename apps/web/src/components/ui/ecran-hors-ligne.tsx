'use client';

import { useEffect } from 'react';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { useEnLigne } from '@/lib/use-en-ligne';

/** La page demandée n'a jamais été ouverte : on le dit, et elle s'ouvre seule au retour du réseau. */
export function EcranHorsLigne() {
  const enLigne = useEnLigne();
  useEffect(() => {
    if (enLigne && window.location.pathname !== '/hors-ligne') window.location.reload();
  }, [enLigne]);

  return (
    <div className="p-4 safe-top">
      <EtatVide
        titre="Cette page n'est pas disponible hors ligne"
        texte="Elle n'a pas encore été ouverte sur ce téléphone. Elle s'affichera toute seule dès que le réseau reviendra."
      >
        <Bouton variante="secondaire" onClick={() => window.history.back()}>
          Retour
        </Bouton>
      </EtatVide>
    </div>
  );
}
