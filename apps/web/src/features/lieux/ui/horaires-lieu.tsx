import { Clock } from 'lucide-react';
import { cn } from '@/lib/classes';
import { lireHoraires, resumeDuJour } from '../horaires/lire-horaires';

/** Même colonnes pour le résumé et les lignes : les heures du jour s'alignent sur celles du dessous. */
const GRILLE = 'grid grid-cols-[minmax(0,8.25rem)_minmax(0,1fr)] gap-2.5';

/** « 9 h – 12 h », « 7 h 30 – coucher du soleil » : une plage d'heures, pas un commentaire de la source. */
const PLAGE_HEURES = /^\d{1,2} h( \d\d)? – /;

/**
 * Une plage par ligne ; une plage d'heures n'est jamais coupée au milieu (« 14 h – 18 h 30 » reste entière),
 * un commentaire de la source peut aller à la ligne.
 */
function Plages({ heures }: { heures: string[] }) {
  return (
    <span className="tabular flex flex-col gap-0.5 text-md font-semibold">
      {heures.map((h) => (
        <span key={h} className={cn(PLAGE_HEURES.test(h) ? 'whitespace-nowrap' : 'text-pretty')}>
          {h}
        </span>
      ))}
    </span>
  );
}

/**
 * Horaires d'ouverture en lignes françaises (D108) : en haut, « Aujourd'hui, ven. 20 nov. : … » quand la
 * règle du jour est sûre ; puis « quand » à gauche, heures à droite, ligne du jour sur un fond léger.
 * Texte non compris : le texte d'origine, tel quel.
 * `dateDuJour` arrive en paramètre (`useDateDuJour()` de l'écran) : ce composant ne lit pas l'horloge.
 */
export function HorairesLieu({ texte, dateDuJour }: { texte: string; dateDuJour: string }) {
  const lignes = lireHoraires(texte, dateDuJour);
  const resume = lignes && resumeDuJour(lignes, dateDuJour);
  return (
    <section aria-label="Horaires" className="flex gap-3 border-b px-3.5 py-3 last:border-b-0">
      <Clock aria-hidden="true" className="mt-0.5 size-5 flex-none text-primary" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Horaires</span>
        {resume && (
          <p className={cn(GRILLE, 'pb-1')}>
            <span className="text-sm font-semibold text-foreground">{resume.jour}</span>
            <Plages heures={resume.heures} />
          </p>
        )}
        {lignes ? (
          <dl className="flex flex-col gap-1">
            {lignes.map((ligne, i) => (
              <div
                key={i}
                className={cn(
                  GRILLE,
                  '-mx-2 rounded-md px-2 py-1.5',
                  ligne.aujourdhui && 'bg-primary-soft',
                )}
              >
                <dt
                  className={cn(
                    'text-sm',
                    ligne.aujourdhui ? 'text-foreground' : 'text-muted-foreground',
                    ligne.quand === null && 'sr-only',
                  )}
                >
                  {ligne.quand ?? 'Horaires'}
                </dt>
                <dd className={cn(ligne.quand === null && 'col-span-2')}>
                  <Plages heures={ligne.heures} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <span className="text-md text-pretty">{texte}</span>
        )}
      </div>
    </section>
  );
}
