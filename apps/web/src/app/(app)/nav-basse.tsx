'use client';

import {
  Binoculars,
  ChevronRight,
  CircleUserRound,
  Compass,
  Database,
  Info,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState, type ComponentProps, type ReactNode } from 'react';
import { Feuille } from '@/components/ui/feuille';
import { marque } from '@/config/marque';
import { filtresDeLUrl, lienAvecDepart } from '@/features/explorer/filtres';
import { cn } from '@/lib/classes';

const ENTREES = [
  { href: '/', libelle: 'Explorer', Icone: Compass },
  { href: '/lieux', libelle: 'Lieux', Icone: Binoculars },
  { href: '/mon-espace', libelle: 'Mon espace', Icone: CircleUserRound },
] as const;

const ENTREES_MENU: readonly {
  libelle: string;
  detail: string;
  Icone: LucideIcon;
  href: string;
}[] = [
  {
    libelle: 'À propos',
    detail: `${marque.nom}, gratuit et sans inscription`,
    Icone: Info,
    href: '/a-propos',
  },
  {
    libelle: 'Sources des données',
    detail: 'Trains, lieux, transports',
    Icone: Database,
    href: '/sources',
  },
];

const CLASSES_ENTREE =
  'flex h-14.5 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-xs whitespace-nowrap lg:h-16 lg:flex-none';

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

/**
 * Explorer et Lieux gardent la gare choisie, la date et leurs propres filtres : chaque onglet retient
 * ceux de son écran, en mémoire (D070). L'URL n'est connue que dans le navigateur.
 */
function LienEntree({ href, children, ...reste }: ComponentProps<typeof Link> & { href: string }) {
  const url = useSearchParams();
  const surCetEcran = usePathname() === href;
  const [filtres, setFiltres] = useState('');
  const filtresActuels = filtresDeLUrl(url);
  if (surCetEcran && filtres !== filtresActuels) setFiltres(filtresActuels);
  const lien =
    href === '/' || href === '/lieux'
      ? lienAvecDepart(href, url, surCetEcran ? filtresActuels : filtres)
      : href;
  return (
    <Link href={lien} {...reste}>
      {children}
    </Link>
  );
}

/** Barre du bas sur mobile, rail vertical à gauche sur grand écran. */
export function NavBasse() {
  const chemin = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const classesEtat = (actif: boolean) =>
    actif ? 'font-bold text-nav-foreground' : 'font-medium text-nav-muted';

  return (
    <nav
      aria-label="Navigation principale"
      className="z-header order-last flex-none bg-nav-bg safe-bottom lg:order-none lg:w-rail"
    >
      <div className="flex px-1.5 py-2 lg:h-full lg:flex-col lg:gap-1.5 lg:py-5">
        {ENTREES.map(({ href, libelle, Icone }) => {
          const actif = chemin === href && !menuOuvert;
          const proprietes = {
            'aria-current': chemin === href ? ('page' as const) : undefined,
            className: cn(CLASSES_ENTREE, classesEtat(actif)),
            children: (
              <ContenuEntree actif={actif} Icone={Icone}>
                {libelle}
              </ContenuEntree>
            ),
          };
          return (
            <Suspense key={href} fallback={<Link href={href} {...proprietes} />}>
              <LienEntree href={href} {...proprietes} />
            </Suspense>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={menuOuvert}
          onClick={() => setMenuOuvert(true)}
          className={cn(CLASSES_ENTREE, 'lg:mt-auto', classesEtat(menuOuvert))}
        >
          <ContenuEntree actif={menuOuvert} Icone={Info}>
            Infos
          </ContenuEntree>
        </button>
      </div>

      <Feuille ouverte={menuOuvert} surChangement={setMenuOuvert} titre="Menu" ancreeAuRail>
        <ul className="flex flex-col">
          {ENTREES_MENU.map(({ libelle, detail, Icone, href }) => (
            <li key={libelle}>
              <Link
                href={href}
                onClick={() => setMenuOuvert(false)}
                className="flex min-h-14 items-center gap-3"
              >
                <Icone aria-hidden="true" className="size-5.5 flex-none text-primary" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-semibold">{libelle}</span>
                  <span className="text-sm text-muted-foreground">{detail}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-5 flex-none" />
              </Link>
            </li>
          ))}
        </ul>
      </Feuille>
    </nav>
  );
}
