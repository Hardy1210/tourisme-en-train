import { Fragment } from 'react';
import { liensAttributionFondCarte } from '@/lib/external/fond-carte';

/** Mention exigée par les licences : liens sans couleur ni soulignement, à la demande de Hardy (D073). */
export function AttributionFondCarte() {
  return liensAttributionFondCarte.map(({ texte, url }, position) => (
    <Fragment key={url}>
      {position > 0 && ' '}
      {/* Sur mobile, le parent laisse passer le toucher vers la carte : le lien le reprend. */}
      <a href={url} target="_blank" rel="noopener" className="pointer-events-auto">
        {texte}
      </a>
    </Fragment>
  ));
}
