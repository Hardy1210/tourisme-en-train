'use client';

import { Car, Leaf, Plane, TrainFront, Users, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Bouton } from '@/components/ui/bouton';
import { Feuille } from '@/components/ui/feuille';
import { Squelette } from '@/components/ui/squelette';
import { formaterKg } from '@/features/destinations/presentation';
import { cn } from '@/lib/classes';
import { useImpact } from '../hooks';
import { lignesImpact, type ModeImpact } from '../presentation';

const MODES: Record<ModeImpact, { libelle: string; Icone: LucideIcon }> = {
  train: { libelle: 'Train', Icone: TrainFront },
  voiturePartagee: { libelle: 'Voiture partagée', Icone: Users },
  voitureSeule: { libelle: 'Voiture seule', Icone: Car },
  avion: { libelle: 'Avion', Icone: Plane },
};

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  depart: string;
  arrivee: string;
};

/** Détail du CO₂ : aller-retour, par personne, calcul local à partir des facteurs de l'ADEME. */
export function FeuilleComparer({ ouverte, surChangement, depart, arrivee }: Proprietes) {
  const impact = useImpact(depart, arrivee, ouverte);

  return (
    <Feuille ouverte={ouverte} surChangement={surChangement} titre="Comparer l'impact">
      {impact.isPending && <Squelette aria-hidden="true" className="h-56 rounded-lg" />}
      {impact.isError && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-md text-muted-foreground">
            Cette comparaison n&apos;a pas pu être chargée.
          </p>
          <Bouton variante="secondaire" onClick={() => void impact.refetch()}>
            Réessayer
          </Bouton>
        </div>
      )}
      {impact.data && (
        <div className="flex flex-col gap-4">
          {impact.data.co2EconomiseKg !== null && (
            <p className="flex items-center gap-2.5 rounded-lg bg-eco-soft px-3.5 py-3">
              <Leaf aria-hidden="true" className="size-5 flex-none text-eco" />
              <span>
                Vous économisez{' '}
                <strong className="tabular text-eco">
                  {formaterKg(impact.data.co2EconomiseKg)} kg de CO₂
                </strong>{' '}
                par rapport à la voiture seule
              </span>
            </p>
          )}
          <ul aria-label="Émissions par mode de transport" className="flex flex-col gap-3.5">
            {lignesImpact(impact.data.co2Kg).map(({ mode, kg, largeurPct, plusSobre }) => {
              const { libelle, Icone } = MODES[mode];
              const train = mode === 'train';
              return (
                <li key={mode} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-md">
                    <Icone
                      aria-hidden="true"
                      className={cn('size-4.5', train ? 'text-primary' : 'text-muted-foreground')}
                    />
                    <span className={train ? 'font-bold' : 'font-medium'}>{libelle}</span>
                    {plusSobre && <Badge variante="eco">Le plus sobre</Badge>}
                    <span className={cn('tabular ml-auto', train ? 'font-bold' : 'font-medium')}>
                      {formaterKg(kg)} kg
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-pill bg-surface-sunken">
                    <div
                      className={cn(
                        'h-full min-w-1.5 rounded-pill',
                        train ? 'bg-primary' : 'bg-border-strong',
                      )}
                      style={{ width: `${largeurPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {impact.data.co2Kg.avion === null && (
              <li className="flex items-center gap-2 border-t pt-3 text-md text-muted-foreground">
                <Plane aria-hidden="true" className="size-4.5" />
                <span>Avion</span>
                <span className="ml-auto text-sm">Non pertinent sur cette distance</span>
              </li>
            )}
          </ul>
          <p className="text-xs text-muted-foreground">
            Valeurs en kg de CO₂, aller-retour, par personne. Source : {impact.data.source},
            facteurs relevés le {impact.data.dateReleve.split('-').reverse().join('/')}. Distance
            estimée.
          </p>
        </div>
      )}
    </Feuille>
  );
}
