// Choix du texte de la fiche d'un lieu (D123). Tests en paires : le cas et sa limite.
import { describe, expect, it } from 'vitest';
import { choisirDescription, type DescriptionAjoutee } from './description';

const wikipedia: DescriptionAjoutee = {
  origine: 'wikipedia',
  texte: 'Introduction de l’article.',
  credit: 'Wikipédia',
  licence: 'CC BY-SA 4.0',
  lien: 'https://fr.wikipedia.org/wiki/Exemple',
};
const notre: DescriptionAjoutee = {
  origine: 'wagoo',
  texte: 'Notre texte.',
  credit: 'Wagoo',
  licence: null,
  lien: null,
};
const choisir = (source: string, description: string | null, ajoutees: DescriptionAjoutee[]) =>
  choisirDescription({ source, description, ajoutees, sourcesAvantWikipedia: ['datatourisme'] });

describe('choisirDescription', () => {
  it('DATAtourisme passe avant Wikipédia : texte des offices de tourisme, pour les visiteurs', () => {
    expect(choisir('datatourisme', 'Texte de l’office.', [wikipedia])).toEqual({
      texte: 'Texte de l’office.',
      ajoutee: null,
    });
  });

  it('limite : une description OSM (souvent quelques mots) passe après Wikipédia', () => {
    expect(choisir('osm', 'Maison du 15e siècle', [wikipedia])).toEqual({
      texte: 'Introduction de l’article.',
      ajoutee: wikipedia,
    });
  });

  it('sans texte Wikipédia, la description de la source reste, quelle qu’elle soit', () => {
    expect(choisir('osm', 'Maison du 15e siècle', [])).toEqual({
      texte: 'Maison du 15e siècle',
      ajoutee: null,
    });
  });

  it('sans description de la source, le texte Wikipédia', () => {
    expect(choisir('datatourisme', null, [wikipedia])?.ajoutee).toBe(wikipedia);
  });

  it('nos propres textes passent avant tout, même DATAtourisme', () => {
    expect(choisir('datatourisme', 'Texte de l’office.', [wikipedia, notre])?.ajoutee).toBe(notre);
  });

  it('limite : aucun texte, ou seulement des blancs → rien', () => {
    expect(choisir('osm', null, [])).toBeNull();
    expect(choisir('osm', '  ', [{ ...wikipedia, texte: ' \n ' }])).toBeNull();
  });
});
