'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { parametres } from '@/config/parametres';

/**
 * La page demandée n'a jamais été ouverte : on le dit, et elle s'ouvre seule au retour du réseau.
 * On interroge le serveur au lieu de se fier à l'événement `online` : il part avant que la connexion
 * soit prête, et ne repart pas si le rechargement échoue (D071).
 */
export function EcranHorsLigne() {
  const routeur = useRouter();
  useEffect(() => {
    if (window.location.pathname === '/hors-ligne') return;
    const verifier = () => {
      fetch('/api/sante', { cache: 'no-store' })
        .then((reponse) => {
          if (reponse.ok) window.location.reload();
        })
        .catch(() => undefined);
    };
    const minuteur = setInterval(verifier, parametres.cache.verificationReseauS * 1000);
    window.addEventListener('online', verifier);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener('online', verifier);
    };
  }, []);

  return (
    <div className="p-4 safe-top">
      <EtatVide
        titre="Cette page n'est pas disponible hors ligne"
        texte="Elle n'a pas encore été ouverte sur ce téléphone. Elle s'affichera toute seule dès que le réseau reviendra."
      >
        {/* Pas `history.back()` : cette adresse figure deux fois dans l'historique, on y resterait bloqué. */}
        <Bouton variante="secondaire" onClick={() => routeur.push('/')}>
          Revenir à Explorer
        </Bouton>
      </EtatVide>
    </div>
  );
}
