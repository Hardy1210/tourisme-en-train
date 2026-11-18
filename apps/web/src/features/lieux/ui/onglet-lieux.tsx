'use client';

import type { Categorie } from '@tourisme/commun';
import { ChevronDown } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Bouton } from '@/components/ui/bouton';
import { EtatVide } from '@/components/ui/etat-vide';
import { Squelette } from '@/components/ui/squelette';
import { parametres } from '@/config/parametres';
import { cn } from '@/lib/classes';
import { grouperParCategorie, libelleVoirAutres, lieuxVisibles } from '../presentation';
import type { LieuResume } from '../schemas';
import { CarteLieuSurMarque } from './carte-lieu-sur-marque';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';

const { lieuxParCategorie } = parametres.limites;

type Proprietes = {
  lieuxCharges: boolean;
  lieux: readonly LieuResume[] | undefined;
  chargement: boolean;
  erreur: boolean;
  surReessai: () => void;
  surTrains: () => void;
  lienDe: (cle: string) => string;
  surCarte: (cle: string) => void;
  /** Mini-carte, sur mobile ; sur grand écran, la carte occupe la colonne de droite. */
  carte: ReactNode;
};

export function OngletLieux({
  lieuxCharges,
  lieux,
  chargement,
  erreur,
  surReessai,
  surTrains,
  lienDe,
  surCarte,
  carte,
}: Proprietes) {
  const blocCarte = useRef<HTMLDivElement>(null);
  const [deplies, setDeplies] = useState<ReadonlySet<Categorie>>(new Set());
  if (!lieuxCharges) {
    return (
      <EtatVide
        titre="Les lieux de cette destination ne sont pas encore disponibles"
        texte="Pour l'instant, nous couvrons la Bourgogne-Franche-Comté. Les trains, eux, sont bien réels."
      >
        <Bouton variante="secondaire" onClick={surTrains}>
          Voir les trains
        </Bouton>
      </EtatVide>
    );
  }
  if (chargement) return <Squelette aria-hidden="true" className="h-64 rounded-lg" />;
  if (erreur) {
    return (
      <EtatVide titre="Ces lieux n'ont pas pu être chargés" texte="Réessayez dans un instant.">
        <Bouton variante="secondaire" onClick={surReessai}>
          Réessayer
        </Bouton>
      </EtatVide>
    );
  }
  if (!lieux || lieux.length === 0) {
    return (
      <EtatVide
        titre="Aucun lieu repéré à pied de cette gare"
        texte="Nos sources ne signalent pas de sortie à proximité. D'autres gares en ont peut-être davantage."
      >
        <Bouton variante="secondaire" onClick={surTrains}>
          Voir les trains
        </Bouton>
      </EtatVide>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {carte && (
        <div ref={blocCarte} className="h-52 flex-none scroll-mt-1 overflow-hidden rounded-lg">
          {carte}
        </div>
      )}
      {grouperParCategorie(lieux).map(({ categorie, lieux: duGroupe }) => {
        const { libelle, classeFond, classeTexte } = APPARENCE_CATEGORIE[categorie];
        const { visibles, caches } = lieuxVisibles(
          duGroupe,
          lieuxParCategorie,
          deplies.has(categorie),
        );
        return (
          <section key={categorie} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-md font-bold text-page-marque-texte">
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-pill',
                  classeFond,
                  classeTexte,
                )}
              >
                <IconeCategorie categorie={categorie} className="size-4" />
              </span>
              {libelle}
              <span className="tabular text-sm font-normal text-page-marque-texte-muted">
                {duGroupe.length}
              </span>
            </h3>
            <ul className="flex flex-col gap-2">
              {visibles.map((lieu) => (
                <CarteLieuSurMarque
                  key={lieu.cle}
                  lieu={lieu}
                  lien={lienDe(lieu.cle)}
                  surCarte={() => {
                    surCarte(lieu.cle);
                    blocCarte.current?.scrollIntoView({ block: 'nearest' });
                  }}
                />
              ))}
            </ul>
            {caches > 0 && (
              <Bouton
                variante="sur-marque"
                className="w-full rounded-carte bg-carte-sur-marque-bg"
                onClick={() => setDeplies((avant) => new Set(avant).add(categorie))}
              >
                {libelleVoirAutres(caches)}
                <ChevronDown aria-hidden="true" className="size-4" />
              </Bouton>
            )}
          </section>
        );
      })}
    </div>
  );
}
