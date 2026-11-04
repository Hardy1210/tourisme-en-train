import { CATEGORIES } from '@tourisme/commun';
import { ArrowRight, Check, Clock, Leaf, MapPinOff, Moon, TrainFront } from 'lucide-react';
import Link from 'next/link';
import { Bouton } from '@/components/ui/bouton';
import { Carte } from '@/components/ui/carte';
import { parametres } from '@/config/parametres';
import { APPARENCE_CATEGORIE, IconeCategorie } from '@/features/lieux/ui/icone-categorie';
import { cn } from '@/lib/classes';
import { couleurTranche, formaterDuree, formaterKg, formaterPrix } from '../presentation';
import type { Destination } from '../schemas';

type Proprietes = {
  destination: Destination;
  lien: string;
  /** Survol croisé avec la carte, sur grand écran. */
  survolee: boolean;
  surSurvol: (uic: string | null) => void;
};

export function CarteDestination({ destination: d, lien, survolee, surSurvol }: Proprietes) {
  return (
    <Carte
      className={cn('relative', survolee && 'ring-2 ring-primary')}
      onMouseEnter={() => surSurvol(d.gare.uic)}
      onMouseLeave={() => surSurvol(null)}
    >
      <span
        aria-hidden="true"
        className="absolute top-5.5 -left-6.5 size-3.25 rounded-pill border-3 border-primary bg-background"
      />
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              'size-2.5 flex-none rounded-pill',
              couleurTranche(d.trancheTemps, parametres.durees.tranchesTempsMin),
            )}
          />
          <h3 className="text-xl leading-tight font-bold">{d.titre}</h3>
        </div>
        <span className="tabular flex items-center gap-1 text-lg font-bold whitespace-nowrap text-primary">
          <Clock aria-hidden="true" className="size-4" />
          {formaterDuree(d.dureeMin)}
        </span>
      </div>
      {d.horsVille && d.commune.nom && (
        <p className="text-sm text-muted-foreground">à {d.commune.nom}</p>
      )}

      <p className="tabular flex items-center gap-1.5 text-sm text-muted-foreground">
        <TrainFront aria-hidden="true" className="size-4 flex-none text-primary" />
        <span>
          {d.nbTrains} {d.nbTrains > 1 ? 'trains' : 'train'}/jour · 1er {d.premierDepart.texte}
          {d.dernierRetour && ` · retour ${d.dernierRetour.texte}`}
        </span>
      </p>

      {d.lieuxCharges ? (
        <ul className="flex flex-wrap gap-1.5">
          {CATEGORIES.filter((c) => (d.lieuxParCategorie[c] ?? 0) > 0).map((c) => {
            const { libelle, classeFond, classeTexte } = APPARENCE_CATEGORIE[c];
            const nombre = d.lieuxParCategorie[c];
            return (
              <li
                key={c}
                aria-label={`${nombre} ${libelle}`}
                className={cn(
                  'tabular flex h-7.5 items-center gap-1 rounded-pill pr-2.5 pl-2 text-sm font-bold',
                  classeFond,
                  classeTexte,
                )}
              >
                <IconeCategorie categorie={c} className="size-4" />
                {nombre}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinOff aria-hidden="true" className="size-4 flex-none" />
          Hors région · trains seulement
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm">
        <span
          className={cn(
            'flex items-center gap-1',
            d.faisableJournee ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {d.faisableJournee ? (
            <Check aria-hidden="true" className="size-4 text-primary" />
          ) : (
            <Moon aria-hidden="true" className="size-4" />
          )}
          {d.faisableJournee ? 'Faisable dans la journée' : 'Retour tôt, plutôt sur 2 jours'}
        </span>
        {d.co2EconomiseKg !== null && (
          <span
            aria-label={`${formaterKg(d.co2EconomiseKg)} kilos de CO₂ économisés, aller-retour`}
            className="tabular flex items-center gap-1 font-semibold text-eco"
          >
            <Leaf aria-hidden="true" className="size-4" />−{formaterKg(d.co2EconomiseKg)} kg CO₂
          </span>
        )}
      </div>

      <div className="h-px bg-border" aria-hidden="true" />

      <div className="tabular flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-md">
        {d.prochainDepart && d.prochaineArrivee ? (
          <span>
            <span className="text-muted-foreground">Prochain :</span>{' '}
            <strong className="font-semibold">
              {d.prochainDepart.texte} → {d.prochaineArrivee.texte}
            </strong>
          </span>
        ) : (
          <span className="text-muted-foreground">Plus de train direct ce jour</span>
        )}
        {d.prixEstime && (
          <span
            className="font-semibold"
            aria-label={`Prix estimé pour un aller : ${formaterPrix(d.prixEstime)}`}
          >
            {formaterPrix(d.prixEstime)}{' '}
            <span className="text-sm font-normal text-muted-foreground">l&apos;aller</span>
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <Bouton variante="sortie" asChild>
          <Link href={lien}>
            Voir la sortie
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Bouton>
      </div>
    </Carte>
  );
}
