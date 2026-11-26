'use client';

import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Bouton } from '@/components/ui/bouton';
import { cn } from '@/lib/classes';

import type { FicheLieu } from '../schemas';

const LONGUEUR_RESUME = 240;

/**
 * Un bloc (horaires, période, adresse) dans la carte d'infos sur le fond de la marque (maquette Fiche-Lieu) :
 * icône à gauche, trait fin entre deux blocs, en retrait des bords.
 */
export const CLASSES_BLOC_INFO =
  'mx-4 flex gap-3 border-b border-tuile-sur-marque-bg py-3.5 last:border-b-0';

export function Info({
  Icone,
  titre,
  children,
}: {
  Icone: LucideIcon;
  titre: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={titre} className={CLASSES_BLOC_INFO}>
      <Icone aria-hidden="true" className="mt-px size-5.5 flex-none" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold text-carte-sur-marque-texte-muted">{titre}</span>
        <span className="text-md text-pretty">{children}</span>
      </div>
    </section>
  );
}

const CLASSES_LIEN = 'underline decoration-dotted underline-offset-2 hover:text-page-marque-texte';

/**
 * Sous un texte ajouté (D123) : « Texte : Wikipédia (extrait) · CC BY-SA 4.0 », l'article et la licence
 * liés quand on les a. « Extrait » : le texte est coupé et nettoyé (la licence demande de le dire).
 */
function LigneCreditTexte({ credit }: { credit: NonNullable<FicheLieu['creditDescription']> }) {
  return (
    <p className="text-xs text-page-marque-texte-muted">
      Texte :{' '}
      {credit.lien ? (
        <a href={credit.lien} target="_blank" rel="noopener noreferrer" className={CLASSES_LIEN}>
          {credit.credit}
        </a>
      ) : (
        credit.credit
      )}
      {credit.licence && (
        <>
          {' '}
          (extrait) ·{' '}
          {credit.licenceUrl ? (
            <a
              href={credit.licenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={CLASSES_LIEN}
            >
              {credit.licence}
            </a>
          ) : (
            credit.licence
          )}
        </>
      )}
    </p>
  );
}

/**
 * Description en texte brut, jamais en HTML (D105) : ses paragraphes sont gardés par `whitespace-pre-line`.
 * Sa source juste dessous (règle 8) : « Source : » + attribution de `config/sources.json` ; pour un texte
 * ajouté (Wikipédia, D123), son propre crédit.
 */
export function Description({
  texte,
  source,
  credit,
}: {
  texte: string;
  source: string;
  credit: FicheLieu['creditDescription'];
}) {
  const [ouverte, setOuverte] = useState(false);
  const longue = texte.length > LONGUEUR_RESUME;
  return (
    <div className="flex flex-col items-start gap-1 px-1">
      <p
        className={cn(
          'text-base leading-relaxed whitespace-pre-line text-pretty',
          longue && !ouverte && 'line-clamp-4',
        )}
      >
        {texte}
      </p>
      {longue && (
        <Bouton
          variante="fantome-sur-marque"
          aria-expanded={ouverte}
          className="-ml-2 px-2 font-semibold underline underline-offset-4"
          onClick={() => setOuverte(!ouverte)}
        >
          {ouverte ? 'Réduire' : 'Lire la suite'}
        </Bouton>
      )}
      {credit ? (
        <LigneCreditTexte credit={credit} />
      ) : (
        <p className="text-xs text-page-marque-texte-muted">Source : {source}</p>
      )}
    </div>
  );
}
