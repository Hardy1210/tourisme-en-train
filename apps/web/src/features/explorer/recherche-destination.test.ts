// Recherche d'une destination dans la liste déjà chargée (D084). Données d'exemple.
import { describe, expect, it } from 'vitest';

import type { Destination } from '@/features/destinations/schemas';

import { filtrerDestinations, libelleDestination, normaliser } from './recherche-destination';

type Exemple = { titre: string; commune?: string; gare: string; autres?: string[] };

const destination = ({ titre, commune = titre, gare, autres = [] }: Exemple) =>
  ({
    titre,
    commune: { nom: commune, codeInsee: null },
    gare: { uic: gare, nom: gare },
    autresGares: autres.map((nom) => ({ uic: nom, nom, dureeMin: 0, nbTrains: 0 })),
  }) as unknown as Destination;

const LISTE = [
  destination({ titre: 'Beaune', gare: 'Beaune' }),
  destination({ titre: 'Bligny-lès-Beaune', gare: 'Bligny-lès-Beaune' }),
  destination({ titre: 'Besançon', gare: 'Besançon-Viotte', autres: ['Besançon-Mouillère'] }),
  destination({ titre: 'Dijon', gare: 'Dijon-Ville', autres: ['Dijon-Porte-Neuve'] }),
  destination({ titre: 'Besançon Franche-Comté TGV', commune: 'Les Auxons', gare: 'Besançon TGV' }),
];
const titres = (recherche: string, destination: string | null = null) =>
  filtrerDestinations(LISTE, { recherche, destination }).map((d) => d.titre);

describe('normaliser', () => {
  it('sans accents, sans majuscules, tirets et apostrophes en espaces', () => {
    expect(normaliser('  Bligny-lès-BEAUNE ')).toBe('bligny les beaune');
    expect(normaliser('L’Isle-sur-le-Doubs')).toBe('l isle sur le doubs');
  });
});

describe('filtrerDestinations', () => {
  it('recherche vide ou blanche → toute la liste, dans le même ordre', () => {
    expect(filtrerDestinations(LISTE, { recherche: '', destination: null })).toBe(LISTE);
    expect(filtrerDestinations(LISTE, { recherche: '   ', destination: null })).toBe(LISTE);
  });

  it('début de mot : « beau » → Beaune et Bligny-lès-Beaune ; « eaune » (milieu de mot) → rien', () => {
    expect(titres('beau')).toEqual(['Beaune', 'Bligny-lès-Beaune']);
    expect(titres('eaune')).toEqual([]);
  });

  it('texte tapé « Beaune » : tous les noms qui commencent par lui, Bligny-lès-Beaune compris', () => {
    expect(titres('Beaune')).toEqual(['Beaune', 'Bligny-lès-Beaune']);
  });

  it('destination touchée dans la liste (code de sa gare) : elle seule, même si le texte en ramène deux', () => {
    expect(titres('Beaune', 'Beaune')).toEqual(['Beaune']);
    expect(titres('', 'Dijon-Ville')).toEqual(['Dijon']);
  });

  it('destination touchée absente des résultats (autre date, autres filtres) → aucune', () => {
    expect(titres('Chagny', 'Chagny')).toEqual([]);
  });

  it('sans accents : « besancon » → les deux Besançon', () => {
    expect(titres('besancon')).toEqual(['Besançon', 'Besançon Franche-Comté TGV']);
  });

  it('par une gare : « viotte » et « porte neuve » (seconde gare) trouvent leur ville', () => {
    expect(titres('viotte')).toEqual(['Besançon']);
    expect(titres('porte neuve')).toEqual(['Dijon']);
  });

  it('par la commune d’une gare hors de la ville : « auxons » → Besançon Franche-Comté TGV', () => {
    expect(titres('auxons')).toEqual(['Besançon Franche-Comté TGV']);
  });

  it('tous les mots doivent correspondre : « dijon beaune » → rien ; « xyz » → rien', () => {
    expect(titres('dijon beaune')).toEqual([]);
    expect(titres('xyz')).toEqual([]);
  });
});

describe('libelleDestination (barre du trajet)', () => {
  const sans = { recherche: '', destination: null };
  it('sans recherche → l’invitation', () => {
    expect(libelleDestination(sans, 0)).toEqual({ texte: 'Où aller ?', active: false });
  });

  it('destination touchée → son nom, sans nombre', () => {
    expect(libelleDestination({ recherche: 'Beaune', destination: 'Beaune' }, 1)).toEqual({
      texte: 'Beaune',
      active: true,
    });
  });

  it('texte tapé → entre guillemets, avec le nombre trouvé (même 0)', () => {
    expect(libelleDestination({ recherche: 'beau', destination: null }, 2)).toEqual({
      texte: '« beau » · 2',
      active: true,
    });
    expect(libelleDestination({ recherche: 'xyz', destination: null }, 0)).toEqual({
      texte: '« xyz » · 0',
      active: true,
    });
  });
});
