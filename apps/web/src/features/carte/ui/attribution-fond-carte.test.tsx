import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AttributionFondCarte } from './attribution-fond-carte';

describe('AttributionFondCarte', () => {
  const html = renderToStaticMarkup(<AttributionFondCarte />);

  it('cite les trois mentions, chacune avec son lien', () => {
    expect(html).toContain('href="https://openfreemap.org"');
    expect(html).toContain('href="https://openmaptiles.org"');
    expect(html).toContain('href="https://www.openstreetmap.org/copyright"');
    expect(html.replace(/<[^>]+>/g, '')).toBe('OpenFreeMap © OpenMapTiles © OpenStreetMap');
  });

  it('n’ajoute ni couleur, ni soulignement, ni taille de texte', () => {
    expect(html).not.toMatch(/class="[^"]*(text-|underline|font-)/);
  });
});
