'use client';

import { Building2, TrainFront } from 'lucide-react';
import { useState } from 'react';
import { Bandeau } from '@/components/ui/bandeau';
import { ChampRecherche } from '@/components/ui/champ-recherche';
import { parametres } from '@/config/parametres';
import { useRechercheVille } from '../hooks';

type Proprietes = {
  surChoix: (point: { lat: number; lon: number }) => void;
  indication: string;
};

/** Champ et résultats de la recherche : `surChoix` reçoit le point de la ville ou de la gare choisie. */
export function RechercheVille({ surChoix, indication }: Proprietes) {
  const [texte, setTexte] = useState('');
  const { data, isFetching, isError } = useRechercheVille(texte);
  const assezLong = texte.trim().length >= parametres.localisation.longueurMinRecherche;

  return (
    <div className="flex flex-col gap-2">
      <ChampRecherche
        libelle={indication}
        placeholder={indication}
        value={texte}
        onChange={(evenement) => setTexte(evenement.target.value)}
      />
      {isError && <Bandeau variante="danger">La recherche ne répond pas. Réessayez.</Bandeau>}
      {data?.horsLigne && (
        <Bandeau variante="avertissement">Hors ligne : seules les gares sont proposées.</Bandeau>
      )}
      {assezLong && !isFetching && !isError && data?.resultats.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">Aucun résultat pour cette recherche.</p>
      )}
      {assezLong && (data?.resultats.length ?? 0) > 0 && (
        <ul className="flex flex-col">
          {data?.resultats.map((resultat) => {
            const Icone = resultat.type === 'gare' ? TrainFront : Building2;
            return (
              <li key={`${resultat.type}-${resultat.lat}-${resultat.lon}`}>
                <button
                  type="button"
                  onClick={() => surChoix({ lat: resultat.lat, lon: resultat.lon })}
                  className="flex min-h-touch w-full cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-left hover:bg-surface-sunken"
                >
                  <Icone aria-hidden="true" className="size-5 flex-none text-primary" />
                  <span className="min-w-0 flex-1 text-base font-medium">{resultat.libelle}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
