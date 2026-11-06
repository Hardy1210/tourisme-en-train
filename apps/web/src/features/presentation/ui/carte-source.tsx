import { ArrowUpRight, RefreshCw, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Carte } from '@/components/ui/carte';
import { libelleDate } from '@/lib/dates/calendrier';
import { TEXTES_SOURCES } from '../contenu';
import type { ReponseSources } from '../schemas';

type Proprietes = { source: ReponseSources['sources'][number]; Icone: LucideIcon };

/** Une source : ce qu'elle est, sa licence, l'attribution que cette licence impose, sa date. */
export function CarteSource({ source, Icone }: Proprietes) {
  return (
    <Carte className="h-full">
      <div className="flex items-start gap-3">
        <span className="flex size-10 flex-none items-center justify-center rounded-md bg-primary-soft text-primary">
          <Icone aria-hidden="true" className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-lg leading-tight font-bold text-pretty">{source.nom}</h3>
          <p className="text-sm text-muted-foreground">{source.producteur}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge className="border text-xs">{source.licence}</Badge>
        {source.dateDonnees && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <RefreshCw aria-hidden="true" className="size-3.5" />
            {TEXTES_SOURCES.releve} {libelleDate(source.dateDonnees)}
          </span>
        )}
      </div>
      <p className="text-xs text-pretty text-muted-foreground">{source.attribution}</p>
      <a
        href={source.page}
        target="_blank"
        rel="noopener"
        aria-label={`${TEXTES_SOURCES.lien} : ${source.nom} (nouvel onglet)`}
        className="mt-auto flex h-touch items-center gap-1.5 self-start text-md font-semibold text-primary"
      >
        {TEXTES_SOURCES.lien}
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </a>
    </Carte>
  );
}
