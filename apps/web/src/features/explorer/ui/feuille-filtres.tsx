'use client';

import { Badge } from '@/components/ui/badge';
import { Bouton } from '@/components/ui/bouton';
import { Feuille } from '@/components/ui/feuille';
import { Interrupteur } from '@/components/ui/interrupteur';
import { Selecteur } from '@/components/ui/selecteur';
import { parametres } from '@/config/parametres';
import { FILTRES_PAR_DEFAUT, libelleDureeMax, libelleRayon, type Filtres } from '../filtres';

const OPTIONS_RAYON = parametres.rayons.autourDeMoiOptionsM.map((metres) => ({
  valeur: String(metres),
  libelle: libelleRayon(metres),
}));
const OPTIONS_DUREE = parametres.durees.trainMaxOptionsMin.map((minutes) => ({
  valeur: String(minutes),
  libelle: libelleDureeMax(minutes),
}));

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  filtres: Filtres;
  surModification: (modifications: Partial<Filtres>) => void;
};

/** Rayon, durée de train et faisabilité : chaque choix s'applique tout de suite. */
export function FeuilleFiltres({ ouverte, surChangement, filtres, surModification }: Proprietes) {
  return (
    <Feuille ouverte={ouverte} surChangement={surChangement} titre="Filtres">
      <div className="flex flex-col gap-5">
        <Selecteur
          libelle="Rayon autour de moi"
          options={OPTIONS_RAYON}
          valeur={String(filtres.rayon)}
          surChangement={(valeur) => surModification({ rayon: Number(valeur) })}
        />
        <Selecteur
          libelle="Temps de train maximum"
          options={OPTIONS_DUREE}
          valeur={String(filtres.dureeMax)}
          surChangement={(valeur) => surModification({ dureeMax: Number(valeur) })}
        />
        <div className="flex flex-col divide-y">
          <Interrupteur
            libelle="Faisable dans la journée"
            description="Aller et retour le même jour"
            actif={filtres.faisable}
            surChangement={(faisable) => surModification({ faisable })}
          />
          <Interrupteur
            libelle="Adapté aux poussettes"
            mention={<Badge>Bientôt</Badge>}
            actif={false}
            desactive
          />
        </div>
        <div className="flex gap-2">
          <Bouton
            variante="secondaire"
            className="flex-1"
            onClick={() =>
              surModification({
                categories: FILTRES_PAR_DEFAUT.categories,
                rayon: FILTRES_PAR_DEFAUT.rayon,
                dureeMax: FILTRES_PAR_DEFAUT.dureeMax,
                faisable: FILTRES_PAR_DEFAUT.faisable,
              })
            }
          >
            Réinitialiser
          </Bouton>
          <Bouton className="flex-1" onClick={() => surChangement(false)}>
            Voir les sorties
          </Bouton>
        </div>
      </div>
    </Feuille>
  );
}
