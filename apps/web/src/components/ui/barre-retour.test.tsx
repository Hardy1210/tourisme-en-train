// Barre du haut des fiches : une seule place (utilitaire `barre-retour`), un seul dessin de bouton Retour.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BarreRetour } from './barre-retour';

describe('BarreRetour', () => {
  it('place le bouton Retour par la règle commune, avec le dessin rond sombre', () => {
    const html = renderToStaticMarkup(<BarreRetour surRetour={() => undefined} />);
    expect(html).toMatch(/^<div class="barre-retour">/);
    expect(html).toContain('aria-label="Retour"');
    expect(html).toContain('bg-sur-photo-bouton');
  });
  it('ajoute l’action de droite, et rien sans elle', () => {
    const avec = renderToStaticMarkup(
      <BarreRetour surRetour={() => undefined} droite={<span>date</span>} />,
    );
    expect(avec).toContain('<span>date</span>');
    const sans = renderToStaticMarkup(<BarreRetour surRetour={() => undefined} />);
    expect(sans.match(/<button/g)).toHaveLength(1);
  });
});
