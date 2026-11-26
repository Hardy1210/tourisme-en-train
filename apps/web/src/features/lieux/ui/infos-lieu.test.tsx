// Description d'un lieu (D105) : texte brut, paragraphes gardés (`white-space: pre-line`), jamais du HTML ;
// « Source : … » juste dessous ; sous un texte Wikipédia, son propre crédit (D123). L'ouverture de
// « Lire la suite » se vérifie dans le navigateur (lieux.e2e.ts).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Description } from './infos-lieu';

const SOURCE = 'DATAtourisme (ADN Tourisme), Licence Ouverte Etalab 2.0';

describe('Description', () => {
  it('garde les paragraphes du texte, affichés par `whitespace-pre-line`', () => {
    const html = renderToStaticMarkup(
      <Description texte={'Premier paragraphe.\n\nDeuxième.'} source={SOURCE} credit={null} />,
    );
    expect(html).toContain('whitespace-pre-line');
    expect(html).toContain('Premier paragraphe.\n\nDeuxième.');
  });

  it('un texte qui ressemble à du HTML reste du texte, jamais une balise', () => {
    const html = renderToStaticMarkup(
      <Description texte={'<b>gras</b> <script>alert(1)</script>'} source={SOURCE} credit={null} />,
    );
    expect(html).toContain('&lt;b&gt;gras&lt;/b&gt;');
    expect(html).not.toContain('<b>');
    expect(html).not.toContain('<script>');
  });

  it('« Source : » et l’attribution de la source, sous la description', () => {
    const html = renderToStaticMarkup(
      <Description texte="Un musée." source={SOURCE} credit={null} />,
    );
    expect(html).toContain(`Source : ${SOURCE}`);
    expect(html.indexOf('Un musée.')).toBeLessThan(html.indexOf('Source :'));
  });

  it('texte Wikipédia : « Texte : Wikipédia (extrait) · CC BY-SA 4.0 », article et licence liés (D123)', () => {
    const html = renderToStaticMarkup(
      <Description
        texte="Introduction."
        source={SOURCE}
        credit={{
          credit: 'Wikipédia',
          licence: 'CC BY-SA 4.0',
          licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr',
          lien: 'https://fr.wikipedia.org/wiki/Exemple',
        }}
      />,
    );
    const texte = html.replace(/<[^>]+>/g, '');
    expect(texte).toContain('Texte : Wikipédia (extrait) · CC BY-SA 4.0');
    expect(html).toContain('href="https://fr.wikipedia.org/wiki/Exemple"');
    expect(html).toContain('href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr"');
    expect(texte).not.toContain('Source :');
  });

  it('limite : crédit sans licence ni lien (nos textes) → « Texte : Wagoo », sans « extrait » ni lien', () => {
    const html = renderToStaticMarkup(
      <Description
        texte="Notre texte."
        source={SOURCE}
        credit={{ credit: 'Wagoo', licence: null, licenceUrl: null, lien: null }}
      />,
    );
    expect(html.replace(/<[^>]+>/g, '')).toContain('Texte : Wagoo');
    expect(html).not.toContain('extrait');
    expect(html).not.toContain('<a ');
  });

  it('limite : un texte court n’a pas de « Lire la suite », mais garde sa source', () => {
    const html = renderToStaticMarkup(<Description texte="Court." source={SOURCE} credit={null} />);
    expect(html).not.toContain('Lire la suite');
    expect(html).toContain('Source :');
  });
});
