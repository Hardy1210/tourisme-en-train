'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { parametres } from '@/config/parametres';
import { lireApi } from '@/lib/http/client';
import { etatDepuisErreur, type EtatPosition } from './position';
import { schemaReponseGeocodage, schemaReponseInverse } from './schemas';

const { delaiPositionMs, delaiSaisieMs, longueurMinRecherche } = parametres.localisation;

/** Demande la position tant que `active` ; `redemander` relance la demande au navigateur. */
export function usePosition(active: boolean) {
  const [position, setPosition] = useState<EtatPosition>({ etat: 'attente' });
  const [essais, setEssais] = useState(0);

  useEffect(() => {
    if (!active) return;
    let annulee = false;
    const repondre = (etat: EtatPosition) => {
      if (!annulee) setPosition(etat);
    };
    if (!('geolocation' in navigator)) {
      repondre({ etat: 'indisponible' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => repondre({ etat: 'trouvee', lat: coords.latitude, lon: coords.longitude }),
      (erreur) => repondre(etatDepuisErreur(erreur.code)),
      { timeout: delaiPositionMs },
    );
    return () => {
      annulee = true;
    };
  }, [active, essais]);

  const redemander = useCallback(() => {
    setPosition({ etat: 'attente' });
    setEssais((n) => n + 1);
  }, []);

  return { position, essais, redemander };
}

/** Nom de la commune où se trouve l'utilisateur, pour la puce « Autour de … ». */
export function useCommune(position: { lat: number; lon: number } | null) {
  return useQuery({
    queryKey: ['commune', position?.lat, position?.lon],
    enabled: position !== null,
    queryFn: ({ signal }) =>
      lireApi(
        `/api/geocodage/inverse?lat=${position?.lat}&lon=${position?.lon}`,
        schemaReponseInverse,
        signal,
      ),
  });
}

/** Recherche de ville ou de gare, lancée après une courte pause dans la saisie. */
export function useRechercheVille(texte: string) {
  const [recherche, setRecherche] = useState('');
  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(texte.trim()), delaiSaisieMs);
    return () => clearTimeout(minuteur);
  }, [texte]);

  return useQuery({
    queryKey: ['geocodage', recherche],
    enabled: recherche.length >= longueurMinRecherche,
    queryFn: ({ signal }) =>
      lireApi(`/api/geocodage?q=${encodeURIComponent(recherche)}`, schemaReponseGeocodage, signal),
  });
}
