// Pied des fiches (destination, lieu) : un seul composant, celui de la fiche destination avec le haut arrondi
// des feuilles (Hardy, 20/11). Sa hauteur suit son contenu : aucune hauteur fixe.
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PiedFiche } from './pied-fiche';

const classes = (html: string) => /class="([^"]*)"/.exec(html)?.[1]?.split(' ') ?? [];

describe('PiedFiche', () => {
  it('reprend les marges du pied de la fiche destination, avec le haut arrondi des feuilles', () => {
    const c = classes(renderToStaticMarkup(<PiedFiche>bouton</PiedFiche>));
    expect(c).toEqual(
      expect.arrayContaining(['px-4', 'pt-2.5', 'pb-6', 'rounded-t-feuille', 'shadow-sheet']),
    );
  });
  it('limite : ni trait en haut ni hauteur fixe (la hauteur suit le contenu)', () => {
    const c = classes(renderToStaticMarkup(<PiedFiche>bouton</PiedFiche>));
    expect(c).not.toContain('border-t');
    expect(c.some((k) => /^h-/.test(k))).toBe(false);
  });
  it('est un pied de page et garde son contenu', () => {
    const html = renderToStaticMarkup(<PiedFiche>Acheter mon billet</PiedFiche>);
    expect(html.startsWith('<footer')).toBe(true);
    expect(html).toContain('Acheter mon billet');
  });
});
