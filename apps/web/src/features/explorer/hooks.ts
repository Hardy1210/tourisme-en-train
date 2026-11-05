'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { gareConseilleePour, useGare, useGaresProches } from '@/features/gares/hooks';
import { usePosition } from '@/features/localisation/fournisseur-position';
import { useCommune } from '@/features/localisation/hooks';
import { schemaReponseSources } from '@/features/presentation/schemas';
import { useEcranVisible, useUrlEcran } from '@/lib/ecran-visible';
import { ErreurClient, lireApi } from '@/lib/http/client';
import { useEnLigne } from '@/lib/use-en-ligne';
import { calculerDepart } from './depart';
import { ecrireDerniereGare, lireDerniereGare } from './derniere-gare';
import { ecrireFiltres, lireFiltres, type Filtres } from './filtres';

const statutDe = (erreur: unknown): number | null => {
  if (erreur === null) return null;
  return erreur instanceof ErreurClient ? erreur.statut : 500;
};

/**
 * Gare de départ de l'écran. `?gare=<uic>` n'est écrit que sur un choix de l'utilisateur : la gare
 * conseillée, calculée depuis sa position, ne doit jamais se retrouver dans un lien (D058).
 */
export function useDepart() {
  const routeur = useRouter();
  const chemin = usePathname();
  const parametresUrl = useUrlEcran();
  const uicChoisi = parametresUrl.get('gare');

  const { position, essais, redemander } = usePosition(uicChoisi === null);
  const point = position.etat === 'trouvee' ? { lat: position.lat, lon: position.lon } : null;
  const proches = useGaresProches(point);
  const gareChoisie = useGare(uicChoisi);
  const enLigne = useEnLigne();
  const [derniereGare] = useState(lireDerniereGare);

  const depart = calculerDepart({
    uicChoisi,
    gareChoisie: { donnees: gareChoisie.data, statutErreur: statutDe(gareChoisie.error) },
    position,
    proches: { donnees: proches.data?.gares, statutErreur: statutDe(proches.error) },
    uicConseille: proches.data?.uicConseille ?? null,
    gareHorsLigne: enLigne ? null : derniereGare,
  });
  const gareConnue = depart.etat === 'pret' ? depart.gare : null;
  useEffect(() => {
    if (gareConnue) ecrireDerniereGare(gareConnue);
  }, [gareConnue?.uic]); // eslint-disable-line react-hooks/exhaustive-deps

  const ecrireGare = useCallback(
    (uic: string | null) => {
      const suite = new URLSearchParams(parametresUrl.toString());
      if (uic === null) suite.delete('gare');
      else suite.set('gare', uic);
      const texte = suite.toString();
      routeur.push(texte ? `${chemin}?${texte}` : chemin, { scroll: false });
    },
    [chemin, parametresUrl, routeur],
  );

  const revenirAMaPosition = useCallback(() => {
    ecrireGare(null);
    redemander();
  }, [ecrireGare, redemander]);

  return { depart, point, essais, choisirGare: ecrireGare, revenirAMaPosition };
}

/** Gare de départ et feuille pour en changer, communes aux écrans Explorer et Lieux. */
export function useChoixDepart() {
  const { depart, point, essais, choisirGare, revenirAMaPosition } = useDepart();
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [erreurChoix, setErreurChoix] = useState(false);
  const client = useQueryClient();
  const commune = useCommune(point);

  const choisirGareEtFermer = (uic: string) => {
    setFeuilleOuverte(false);
    setErreurChoix(false);
    choisirGare(uic);
  };
  const choisirPoint = async ({ lat, lon }: { lat: number; lon: number }) => {
    const gare = await gareConseilleePour(client, lat, lon).catch(() => null);
    if (gare) choisirGareEtFermer(gare.uic);
    else setErreurChoix(true);
  };

  const libelle =
    depart.etat === 'pret' && depart.origine === 'choix'
      ? `Au départ de ${depart.gare.nom}`
      : depart.etat === 'pret'
        ? `Autour de ${commune.data?.commune ?? 'vous'}`
        : 'Choisir une ville';

  return {
    depart,
    essais,
    libelle,
    erreurChoix,
    feuilleOuverte,
    setFeuilleOuverte,
    choisirGareEtFermer,
    choisirPoint,
    revenirAMaPosition,
  };
}

/** Filtres lus dans l'URL ; chaque changement crée une entrée d'historique (retour arrière). */
export function useFiltres() {
  const routeur = useRouter();
  const chemin = usePathname();
  const parametresUrl = useUrlEcran();
  const filtres = lireFiltres(parametresUrl);

  const changer = useCallback(
    (modifications: Partial<Filtres>) => {
      const actuels = new URLSearchParams(parametresUrl.toString());
      const suite = ecrireFiltres(actuels, { ...lireFiltres(actuels), ...modifications });
      const texte = suite.toString();
      routeur.push(texte ? `${chemin}?${texte}` : chemin, { scroll: false });
    },
    [chemin, parametresUrl, routeur],
  );

  return { filtres, changer };
}

/** Jusqu'où les horaires sont chargés, pour borner le calendrier. */
export function useFenetreHoraires() {
  const visible = useEcranVisible();
  return useQuery({
    queryKey: ['sources'],
    enabled: visible,
    queryFn: ({ signal }) => lireApi('/api/sources', schemaReponseSources, signal),
    select: (reponse) => reponse.horaires,
  });
}
