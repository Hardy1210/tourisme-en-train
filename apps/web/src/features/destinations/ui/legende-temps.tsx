import { parametres } from '@/config/parametres';
import { cn } from '@/lib/classes';
import { formaterDuree, couleurTranche } from '../presentation';

const { tranchesTempsMin } = parametres.durees;
const derniere = tranchesTempsMin.at(-1) ?? 0;
const TRANCHES = [
  ...tranchesTempsMin.map((borne) => ({ cle: `<=${borne}`, libelle: `≤ ${formaterDuree(borne)}` })),
  { cle: `>${derniere}`, libelle: `> ${formaterDuree(derniere)}` },
];

/** Couleurs des temps de trajet, lues depuis les bornes des paramètres (D055). */
export function LegendeTemps() {
  return (
    <ul
      aria-label="Couleurs selon le temps de train"
      className="tabular mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
    >
      {TRANCHES.map(({ cle, libelle }) => (
        <li key={cle} className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className={cn('size-2.5 rounded-pill', couleurTranche(cle, tranchesTempsMin))}
          />
          {libelle}
        </li>
      ))}
    </ul>
  );
}
