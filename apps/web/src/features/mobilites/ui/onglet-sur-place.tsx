'use client';

import type { TypeMobilite } from '@tourisme/commun';
import { Bike, BusFront, Footprints, MapPin, TramFront, Zap, type LucideIcon } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { formaterDistance } from '@/lib/geo/formats';
import { useMobilites } from '../hooks';
import type { ReponseMobilites } from '../schemas';

const APPARENCE: Record<TypeMobilite, { libelle: string; Icone: LucideIcon }> = {
  TRAM: { libelle: 'Tram', Icone: TramFront },
  BUS: { libelle: 'Bus', Icone: BusFront },
  CAR: { libelle: 'Car', Icone: BusFront },
  VELO: { libelle: 'Vélos', Icone: Bike },
  TROTTINETTE: { libelle: 'Trottinettes', Icone: Zap },
  AUTRE: { libelle: 'Autres', Icone: MapPin },
};

const ORDRE: readonly TypeMobilite[] = ['TRAM', 'BUS', 'CAR', 'VELO', 'TROTTINETTE', 'AUTRE'];

function Arret({ mobilite: m }: { mobilite: ReponseMobilites['mobilites'][number] }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b px-3 py-2.5 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-semibold">{m.nom}</span>
        {m.lignes.length > 0 && (
          <ul aria-label="Lignes" className="flex flex-wrap gap-1">
            {m.lignes.map((ligne) => (
              <li
                key={ligne}
                className="tabular rounded-sm bg-transit-soft px-1.5 text-xs font-semibold text-transit-foreground"
              >
                {ligne}
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className="tabular flex flex-none items-center gap-1 text-sm text-muted-foreground">
        <Footprints aria-hidden="true" className="size-4" />
        {m.dureeMarcheMin} min · {formaterDistance(m.distanceM)}
      </span>
    </li>
  );
}

type Proprietes = {
  uic: string;
  gareNom: string;
  dansRegion: boolean;
  surTrains: () => void;
};

export function OngletSurPlace({ uic, gareNom, dansRegion, surTrains }: Proprietes) {
  const mobilites = useMobilites(uic);

  if (mobilites.isPending) return <Squelette aria-hidden="true" className="h-48 rounded-lg" />;
  if (mobilites.isError) {
    return (
      <EtatVide titre="Les transports n'ont pas pu être chargés" texte="Réessayez dans un instant.">
        <Bouton variante="secondaire" onClick={() => void mobilites.refetch()}>
          Réessayer
        </Bouton>
      </EtatVide>
    );
  }

  const liste = mobilites.data.mobilites;
  if (liste.length === 0) {
    return dansRegion ? (
      <EtatVide
        titre="Aucun transport repéré autour de cette gare"
        texte="Nos sources ne signalent ni bus, ni tram, ni vélos à proximité."
      />
    ) : (
      <EtatVide
        titre="Les transports de cette destination ne sont pas encore disponibles"
        texte="Pour l'instant, nous couvrons la Bourgogne-Franche-Comté. Les trains, eux, sont bien réels."
      >
        <Bouton variante="secondaire" onClick={surTrains}>
          Voir les trains
        </Bouton>
      </EtatVide>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Autour de la gare de {gareNom}</p>
      {ORDRE.map((type) => ({ type, arrets: liste.filter((m) => m.type === type) }))
        .filter((groupe) => groupe.arrets.length > 0)
        .map(({ type, arrets }) => {
          const { libelle, Icone } = APPARENCE[type];
          return (
            <section key={type} className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-md font-bold">
                <Icone aria-hidden="true" className="size-4.5 text-transit" />
                {libelle}
              </h3>
              <ul className="rounded-carte bg-carte-bg shadow-carte">
                {arrets.map((m) => (
                  <Arret key={`${m.source}-${m.nom}-${m.distanceM}`} mobilite={m} />
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
