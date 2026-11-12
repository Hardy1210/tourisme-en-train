// Recherche d'une destination dans la liste déjà chargée (D084). Données d'exemple.
import { describe, expect, it } from 'vitest';

import type { Destination } from '@/features/destinations/schemas';

import {
  filtrerDestinations,
  libelleDestination,
  normaliser,
  plusProches,
} from './recherche-destination';

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

describe('filtrerDestinations : ordre des résultats', () => {
  // Défaut vu sur téléphone le 11/11 : en tapant « b », Paris (1 h 36) passait avant Besançon TGV (26 min).
  const avecDuree = (titre: string, dureeMin: number) =>
    ({ ...destination({ titre, gare: titre }), dureeMin }) as unknown as Destination;
  const DANS_L_ORDRE_DE_L_API = [
    avecDuree('Beaune', 22),
    avecDuree('Besançon', 60),
    avecDuree('Paris', 96),
    avecDuree('Besançon Franche-Comté TGV', 26),
  ];

  it('texte tapé : résultats triés par temps de trajet', () => {
    const trouvees = filtrerDestinations(DANS_L_ORDRE_DE_L_API, {
      recherche: 'b',
      destination: null,
    });
    expect(trouvees.map((d) => d.titre)).toEqual([
      'Beaune',
      'Besançon Franche-Comté TGV',
      'Besançon',
    ]);
    const p = filtrerDestinations(DANS_L_ORDRE_DE_L_API, { recherche: 'p', destination: null });
    expect(p.map((d) => d.titre)).toEqual(['Paris']);
  });

  it('« Les plus proches » : les plus rapides d’abord, au plus le nombre demandé', () => {
    expect(plusProches(DANS_L_ORDRE_DE_L_API, 2).map((d) => d.titre)).toEqual([
      'Beaune',
      'Besançon Franche-Comté TGV',
    ]);
    expect(plusProches(DANS_L_ORDRE_DE_L_API, 10)).toHaveLength(4);
    expect(DANS_L_ORDRE_DE_L_API[2]?.titre).toBe('Paris'); // la liste d'origine ne change pas
  });

  it('rien de cherché : la liste reste dans son ordre (celle d’Explorer)', () => {
    expect(filtrerDestinations(DANS_L_ORDRE_DE_L_API, { recherche: '', destination: null })).toBe(
      DANS_L_ORDRE_DE_L_API,
    );
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
