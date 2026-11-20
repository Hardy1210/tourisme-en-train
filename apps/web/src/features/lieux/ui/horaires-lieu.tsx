import { Clock } from 'lucide-react';
import { cn } from '@/lib/classes';
import { lireHoraires, resumeDuJour } from '../horaires/lire-horaires';

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
          <p className="text-md text-pretty">
            <span className="font-semibold">{resume.jour} :</span>{' '}
            <span className="tabular">{resume.heures}</span>
          </p>
        )}
        {lignes ? (
          <dl className="flex flex-col gap-1">
            {lignes.map((ligne, i) => (
              <div
                key={i}
                className={cn(
                  '-mx-2 grid grid-cols-[minmax(0,8.25rem)_minmax(0,1fr)] gap-2.5 rounded-md px-2 py-1.5',
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
                <dd
                  className={cn(
                    'tabular flex flex-col gap-0.5 text-md font-semibold',
                    ligne.quand === null && 'col-span-2',
                  )}
                >
                  {ligne.heures.map((h) => (
                    <span key={h}>{h}</span>
                  ))}
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
