// Description d'un lieu (D105) : texte brut, paragraphes gardés (`white-space: pre-line`), jamais du HTML ;
// « Source : … » juste dessous. L'ouverture de « Lire la suite » se vérifie dans le navigateur (lieux.e2e.ts).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Description } from './infos-lieu';

const SOURCE = 'DATAtourisme (ADN Tourisme), Licence Ouverte Etalab 2.0';

describe('Description', () => {
  it('garde les paragraphes du texte, affichés par `whitespace-pre-line`', () => {
    const html = renderToStaticMarkup(
      <Description texte={'Premier paragraphe.\n\nDeuxième.'} source={SOURCE} />,
    );
    expect(html).toContain('whitespace-pre-line');
    expect(html).toContain('Premier paragraphe.\n\nDeuxième.');
  });

  it('un texte qui ressemble à du HTML reste du texte, jamais une balise', () => {
    const html = renderToStaticMarkup(
      <Description texte={'<b>gras</b> <script>alert(1)</script>'} source={SOURCE} />,
    );
    expect(html).toContain('&lt;b&gt;gras&lt;/b&gt;');
    expect(html).not.toContain('<b>');
    expect(html).not.toContain('<script>');
  });

  it('« Source : » et l’attribution de la source, sous la description', () => {
    const html = renderToStaticMarkup(<Description texte="Un musée." source={SOURCE} />);
    expect(html).toContain(`Source : ${SOURCE}`);
    expect(html.indexOf('Un musée.')).toBeLessThan(html.indexOf('Source :'));
  });

  it('limite : un texte court n’a pas de « Lire la suite », mais garde sa source', () => {
    const html = renderToStaticMarkup(<Description texte="Court." source={SOURCE} />);
    expect(html).not.toContain('Lire la suite');
    expect(html).toContain('Source :');
  });
});
