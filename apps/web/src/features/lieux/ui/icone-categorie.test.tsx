import { CATEGORIES } from '@tourisme/commun';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { APPARENCE_CATEGORIE, IconeCategorie } from './icone-categorie';

describe('IconeCategorie', () => {
  it.each(CATEGORIES)('donne à « %s » des classes à son nom', (categorie) => {
    const { classeTexte, classeFond } = APPARENCE_CATEGORIE[categorie];
    expect(classeTexte).toBe(`text-cat-${categorie}-foreground`);
    expect(classeFond).toBe(`bg-cat-${categorie}-soft`);
  });

  it('donne une icône différente à chaque catégorie', () => {
    const icones = CATEGORIES.map((categorie) => APPARENCE_CATEGORIE[categorie].Icone);
    expect(new Set(icones).size).toBe(CATEGORIES.length);
  });

  it('annonce le nom de la catégorie quand l’icône est seule', () => {
    const html = renderToStaticMarkup(<IconeCategorie categorie="nature" annoncee />);
    expect(html).toContain('aria-label="Nature"');
    expect(html).not.toContain('aria-hidden');
  });

  it('cache l’icône au lecteur d’écran quand un texte l’accompagne', () => {
    const html = renderToStaticMarkup(<IconeCategorie categorie="nature" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('aria-label');
  });
});
