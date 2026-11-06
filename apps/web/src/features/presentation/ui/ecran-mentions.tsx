import { CadrePage } from '@/components/ui/cadre-page';
import { TEXTES_MENTIONS as T } from '../contenu-mentions';
import { RetourPage } from './retour-page';

export function EcranMentions() {
  return (
    <CadrePage enTete={<RetourPage />}>
      <h1 className="text-3xl leading-tight font-bold text-pretty">{T.titre}</h1>
      {T.sections.map(({ titre, paragraphes }) => (
        <section key={titre} className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{titre}</h2>
          {paragraphes.map((paragraphe) => (
            <p key={paragraphe} className="text-base text-pretty">
              {paragraphe}
            </p>
          ))}
        </section>
      ))}
    </CadrePage>
  );
}
