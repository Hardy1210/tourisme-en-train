'use client';

import {
  CircleUserRound,
  Compass,
  Database,
  Info,
  Landmark,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Feuille } from '@/components/ui/feuille';
import { marque } from '@/config/marque';
import { cn } from '@/lib/classes';

const ENTREES = [
  { href: '/', libelle: 'Explorer', Icone: Compass },
  { href: '/lieux', libelle: 'Lieux', Icone: Landmark },
  { href: '/mon-espace', libelle: 'Mon espace', Icone: CircleUserRound },
] as const;

// « Bientôt » tant que ces écrans n'existent pas (E13) : aucun lien vers une page absente.
const ENTREES_MENU: readonly { libelle: string; detail: string; Icone: LucideIcon }[] = [
  { libelle: 'À propos', detail: `${marque.nom}, gratuit et sans inscription`, Icone: Info },
  { libelle: 'Sources des données', detail: 'Trains, lieux, transports', Icone: Database },
];

const CLASSES_ENTREE =
  'flex h-14.5 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-xs whitespace-nowrap';

function ContenuEntree({
  actif,
  Icone,
  children,
}: {
  actif: boolean;
  Icone: LucideIcon;
  children: ReactNode;
}) {
  return (
    <>
      <span
        className={cn(
          'flex h-8 w-14 items-center justify-center rounded-pill transition-colors',
          actif && 'bg-nav-indicator text-nav-indicator-foreground',
        )}
      >
        <Icone aria-hidden="true" className="size-5.5" />
      </span>
      {children}
    </>
  );
}

export function NavBasse() {
  const chemin = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const classesEtat = (actif: boolean) =>
    actif ? 'font-bold text-nav-foreground' : 'font-medium text-nav-muted';

  return (
    <nav aria-label="Navigation principale" className="z-header flex-none bg-nav-bg safe-bottom">
      <div className="flex px-1.5 py-2">
        {ENTREES.map(({ href, libelle, Icone }) => {
          const actif = chemin === href && !menuOuvert;
          return (
            <Link
              key={href}
              href={href}
              aria-current={chemin === href ? 'page' : undefined}
              className={cn(CLASSES_ENTREE, classesEtat(actif))}
            >
              <ContenuEntree actif={actif} Icone={Icone}>
                {libelle}
              </ContenuEntree>
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={menuOuvert}
          onClick={() => setMenuOuvert(true)}
          className={cn(CLASSES_ENTREE, classesEtat(menuOuvert))}
        >
          <ContenuEntree actif={menuOuvert} Icone={Menu}>
            Menu
          </ContenuEntree>
        </button>
      </div>

      <Feuille ouverte={menuOuvert} surChangement={setMenuOuvert} titre="Menu">
        <ul className="flex flex-col">
          {ENTREES_MENU.map(({ libelle, detail, Icone }) => (
            <li key={libelle} className="flex min-h-14 items-center gap-3">
              <Icone aria-hidden="true" className="size-5.5 flex-none text-primary" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-semibold">{libelle}</span>
                <span className="text-sm text-muted-foreground">{detail}</span>
              </span>
              <Badge>Bientôt</Badge>
            </li>
          ))}
        </ul>
      </Feuille>
    </nav>
  );
}
