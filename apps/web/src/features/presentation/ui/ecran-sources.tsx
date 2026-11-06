'use client';

import type { GroupeSource } from '@tourisme/commun';
import { Bus, Landmark, Layers, ShieldCheck, TrainFront, type LucideIcon } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { CadrePage } from '@/components/ui/cadre-page';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { AttributionFondCarte } from '@/features/carte/ui/attribution-fond-carte';
import { LIBELLES_GROUPES, TEXTES_SOURCES } from '../contenu';
import { useSources } from '../hooks';
import { regrouperSources } from '../regrouper-sources';
import { CarteSource } from './carte-source';
import { RetourPage } from './retour-page';

const ICONES_GROUPES: Record<GroupeSource, LucideIcon> = {
  trains: TrainFront,
  lieux: Landmark,
  transports: Bus,
  carte_calculs: Layers,
};

export function EcranSources() {
  const reponse = useSources();

  return (
    <CadrePage enTete={<RetourPage />}>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl leading-tight font-bold">{TEXTES_SOURCES.titre}</h1>
        <p className="text-base text-pretty text-muted-foreground">{TEXTES_SOURCES.introduction}</p>
      </header>

      {reponse.isPending && (
        <div aria-hidden="true" className="flex flex-col gap-3">
          <Squelette className="h-44 rounded-carte" />
          <Squelette className="h-44 rounded-carte" />
        </div>
      )}
      {reponse.isError && (
        <EtatVide titre={TEXTES_SOURCES.erreurTitre} texte={TEXTES_SOURCES.erreurTexte}>
          <Bouton variante="secondaire" onClick={() => void reponse.refetch()}>
            {TEXTES_SOURCES.reessayer}
          </Bouton>
        </EtatVide>
      )}
      {reponse.data &&
        regrouperSources(reponse.data.sources).map(({ groupe, sources }) => (
          <section
            key={groupe}
            aria-labelledby={`sources-${groupe}`}
            className="flex flex-col gap-3"
          >
            <h2 id={`sources-${groupe}`} className="text-xl font-bold">
              {LIBELLES_GROUPES[groupe]}
            </h2>
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {sources.map((source) => (
                <li key={source.code}>
                  <CarteSource source={source} Icone={ICONES_GROUPES[groupe]} />
                </li>
              ))}
            </ul>
          </section>
        ))}

      <aside className="flex flex-col gap-3 rounded-carte bg-primary-soft p-4 text-md text-pretty text-primary-soft-foreground">
        <p className="[&_a]:underline">
          {TEXTES_SOURCES.fondDeCarte} <AttributionFondCarte />
        </p>
        <p>{TEXTES_SOURCES.defi}</p>
        <p className="flex items-center gap-2.5 border-t pt-3 font-semibold">
          <ShieldCheck aria-hidden="true" className="size-5 flex-none" />
          {TEXTES_SOURCES.position}
        </p>
      </aside>
    </CadrePage>
  );
}
