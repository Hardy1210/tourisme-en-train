import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Bouton } from '@/components/ui/bouton';
import { CadrePage } from '@/components/ui/cadre-page';
import { Carte } from '@/components/ui/carte';
import { Logo } from '@/components/ui/logo';
import { chiffresAffiches, TEXTES_A_PROPOS as T } from '../contenu-a-propos';
import { RetourPage } from './retour-page';

const CLASSES_SECTION = 'flex flex-col gap-3';
const CLASSES_TITRE = 'text-2xl font-bold';
const CLASSES_TEXTE = 'text-base text-pretty';

export function EcranAPropos() {
  return (
    <CadrePage enTete={<RetourPage />}>
      <header className="flex flex-col items-start gap-3">
        <Logo />
        <h1 className="text-3xl leading-tight font-bold text-pretty">{T.accroche}</h1>
      </header>

      <section className={CLASSES_SECTION}>
        <h2 className={CLASSES_TITRE}>{T.constat.titre}</h2>
        {T.constat.paragraphes.map((paragraphe) => (
          <p key={paragraphe} className={CLASSES_TEXTE}>
            {paragraphe}
          </p>
        ))}
      </section>

      <section className={CLASSES_SECTION}>
        <h2 className={CLASSES_TITRE}>{T.importance.titre}</h2>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {chiffresAffiches().map((chiffre) => (
            <li key={chiffre.valeur}>
              <Carte className="h-full">
                <p className="font-display text-3xl leading-tight font-bold text-primary tabular-nums">
                  {chiffre.valeur}
                </p>
                <p className={CLASSES_TEXTE}>{chiffre.texte}</p>
                <ul className="mt-auto flex flex-col">
                  {chiffre.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener"
                        aria-label={`${T.source} ${source.libelle} (nouvel onglet)`}
                        className="flex min-h-touch items-center gap-1 text-sm font-semibold text-primary"
                      >
                        {T.source} {source.libelle}
                        <ArrowUpRight aria-hidden="true" className="size-4 flex-none" />
                      </a>
                    </li>
                  ))}
                </ul>
              </Carte>
            </li>
          ))}
        </ul>
        <p className="text-md text-pretty text-muted-foreground">{T.importance.limite}</p>
      </section>

      <section className={CLASSES_SECTION}>
        <h2 className={CLASSES_TITRE}>{T.solution.titre}</h2>
        <p className={CLASSES_TEXTE}>{T.solution.introduction}</p>
        <ol className="flex list-decimal flex-col gap-1 pl-6 text-base font-semibold">
          {T.solution.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
        <p className={CLASSES_TEXTE}>{T.solution.transports}</p>
      </section>

      <aside className="flex flex-col items-start gap-4 rounded-carte bg-primary-soft p-4 text-primary-soft-foreground">
        <p className="font-display text-2xl leading-tight font-bold text-pretty">{T.accroche}</p>
        <Bouton asChild>
          <Link href="/">{T.ouvrir}</Link>
        </Bouton>
      </aside>
    </CadrePage>
  );
}
