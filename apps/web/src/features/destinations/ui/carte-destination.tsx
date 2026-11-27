import { ArrowRight, Check, Leaf, MapPinOff, Moon, TrainFront } from 'lucide-react';
import Link from 'next/link';
import { Bouton } from '@/components/ui/bouton';
import { Carte } from '@/components/ui/carte';
import { parametres } from '@/config/parametres';
import { cn } from '@/lib/classes';
import {
  billetDestination,
  couleurTranche,
  formaterKg,
  formaterPrix,
  MENTION_ESTIMATION,
} from '../presentation';
import type { DestinationAffichee } from '../presentation';
import { BilletProchainTrain } from './billet-prochain-train';
import { PastillesCategories } from './pastilles-categories';

type Proprietes = {
  destination: DestinationAffichee;
  lien: string;
  /** Gare de départ, sous l'heure du prochain train. */
  gareDepart: string;
  /** La date affichée est aujourd'hui : « Plus de train direct aujourd'hui », sinon « ce jour ». */
  aujourdhui: boolean;
  /** Survol croisé avec la carte (grand écran), ou destination choisie (D2) : contour violet. */
  enAvant: boolean;
  surSurvol: (uic: string | null) => void;
};

/** Carte de destination en billet (maquette B-Max-2, états C1 à C8 et D2, D125). */
export function CarteDestination({
  destination: d,
  lien,
  gareDepart,
  aujourdhui,
  enAvant,
  surSurvol,
}: Proprietes) {
  const trains = d.nbTrains > 1 ? 'trains' : 'train';
  return (
    <Carte
      // Repère pour faire défiler la feuille jusqu'à la première destination trouvée (D084).
      data-destination={d.gare.uic}
      className={cn('relative gap-0 p-0', enAvant && 'ring-2 ring-primary')}
      onMouseEnter={() => surSurvol(d.gare.uic)}
      onMouseLeave={() => surSurvol(null)}
    >
      <span
        aria-hidden="true"
        className="absolute top-5.5 -left-6.5 size-3.25 rounded-pill border-3 border-primary bg-background"
      />
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3.5">
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className={cn(
              'mt-2 size-2.75 flex-none rounded-pill',
              couleurTranche(d.trancheTemps, parametres.durees.tranchesTempsMin),
            )}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="font-display text-xl leading-tight font-extrabold">{d.titre}</h3>
            {d.horsVille && d.commune.nom && (
              <p className="text-xs text-muted-foreground">à {d.commune.nom}</p>
            )}
          </div>
          <span className="tabular mt-0.5 text-sm whitespace-nowrap text-muted-foreground">
            <strong className="text-foreground">{d.nbTrains}</strong> {trains}/jour
          </span>
        </div>

        <BilletProchainTrain
          billet={billetDestination(d, aujourdhui)}
          depart={gareDepart}
          arrivee={d.titre}
        />

        <p className="tabular flex items-center gap-1.5 text-sm text-muted-foreground">
          <TrainFront aria-hidden="true" className="size-4 flex-none" />
          <span>
            1er {d.premierDepart.texte}
            {d.dernierRetour && ` · dernier retour ${d.dernierRetour.texte}`}
          </span>
        </p>

        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span
            className={cn(
              'flex h-7 items-center gap-1 rounded-pill px-2.5 text-xs font-semibold',
              d.faisableJournee ? 'bg-eco-soft text-eco' : 'bg-primary-soft text-muted-foreground',
            )}
          >
            {d.faisableJournee ? (
              <Check aria-hidden="true" className="size-3.5" />
            ) : (
              <Moon aria-hidden="true" className="size-3.5" />
            )}
            {d.faisableJournee ? 'Faisable dans la journée' : 'Retour tôt, plutôt sur 2 jours'}
          </span>
          {d.co2EconomiseKg !== null && (
            <span
              aria-label={`${formaterKg(d.co2EconomiseKg)} kilos de CO₂ économisés, aller-retour`}
              className="tabular flex items-center gap-1 text-sm font-bold whitespace-nowrap text-eco"
            >
              <Leaf aria-hidden="true" className="size-4" />−{formaterKg(d.co2EconomiseKg)} kg CO₂
            </span>
          )}
        </div>

        {d.lieuxCharges ? (
          <PastillesCategories lieuxParCategorie={d.lieuxParCategorie} />
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinOff aria-hidden="true" className="size-4 flex-none" />
            Hors région · trains seulement
          </p>
        )}
      </div>

      {/* Talon du billet : pointillés et encoches, de la couleur du fond de la feuille qui l'entoure. */}
      <div aria-hidden="true" className="relative mx-4 border-t-2 border-dashed border-border">
        <span className="absolute -top-2.5 -left-6.5 size-4.5 rounded-pill bg-background" />
        <span className="absolute -top-2.5 -right-6.5 size-4.5 rounded-pill bg-background" />
      </div>
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-4">
        {d.prixEstime && (
          <span
            className="flex min-w-0 flex-1 flex-col"
            aria-label={`Prix estimé pour un aller : ${formaterPrix(d.prixEstime)}`}
          >
            <strong className="tabular font-display text-xl leading-tight font-extrabold">
              {formaterPrix(d.prixEstime)}
            </strong>
            <span className="text-xs text-muted-foreground">
              l&apos;aller, {MENTION_ESTIMATION}
            </span>
          </span>
        )}
        <Bouton variante="sortie" asChild className="ml-auto">
          <Link href={lien}>
            Voir la sortie
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Bouton>
      </div>
    </Carte>
  );
}
