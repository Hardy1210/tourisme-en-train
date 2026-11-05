'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { parametres } from '@/config/parametres';
import { etatDepuisErreur, type EtatPosition } from './position';

type Contexte = {
  position: EtatPosition;
  essais: number;
  demander: () => void;
  redemander: () => void;
};

const ContextePosition = createContext<Contexte | null>(null);

/**
 * Garde la position au-dessus des écrans : changer d'onglet ne la redemande pas. En mémoire seulement,
 * dans l'état de cette page : ni stockage du navigateur, ni base, ni journal (règle 5).
 */
export function FournisseurPosition({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<EtatPosition>({ etat: 'attente' });
  const [essais, setEssais] = useState(0);
  const enCours = useRef(false);

  const demander = useCallback(() => {
    if (enCours.current) return;
    if (!('geolocation' in navigator)) {
      setPosition({ etat: 'indisponible' });
      return;
    }
    enCours.current = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        enCours.current = false;
        setPosition({ etat: 'trouvee', lat: coords.latitude, lon: coords.longitude });
      },
      (erreur) => {
        enCours.current = false;
        setPosition(etatDepuisErreur(erreur.code));
      },
      { timeout: parametres.localisation.delaiPositionMs },
    );
  }, []);

  const redemander = useCallback(() => {
    setPosition({ etat: 'attente' });
    setEssais((n) => n + 1);
  }, []);

  const valeur = useMemo(
    () => ({ position, essais, demander, redemander }),
    [position, essais, demander, redemander],
  );
  return <ContextePosition.Provider value={valeur}>{children}</ContextePosition.Provider>;
}

/** La position partagée ; la demande au navigateur part tant que `active` et qu'on ne la connaît pas. */
export function usePosition(active: boolean) {
  const contexte = useContext(ContextePosition);
  if (!contexte) throw new Error('usePosition exige FournisseurPosition.');
  const { position, essais, demander, redemander } = contexte;
  const enAttente = position.etat === 'attente';

  useEffect(() => {
    if (active && enAttente) demander();
  }, [active, enAttente, essais, demander]);

  return { position, essais, redemander };
}
