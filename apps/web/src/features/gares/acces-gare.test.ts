import { describe, expect, it } from 'vitest';
import { accesGare, accesGareProche, lienItineraire } from './acces-gare';

// Paramètres du dépôt (`acces`, D091) : marche 4,5 km/h, détour 1,3, à pied jusqu'à 2 000 m mesurés avec le
// détour, soit 1 538 m à vol d'oiseau.
describe('accesGare : trajet de l’utilisateur à sa gare de départ (D096)', () => {
  it('à 1 538 m à vol d’oiseau (2 000 m à pied) : la durée à pied, même avec un parking vélo', () => {
    const attendu = { dureeMarcheMin: 27, dureeVeloMin: null, distance: '1,5 km' };
    expect(accesGare(1538, false)).toEqual(attendu);
    expect(accesGare(1538, true)).toEqual(attendu);
  });

  it('à 1 540 m (plus de 2 000 m à pied), sans parking vélo : la distance seule, sans durée', () => {
    expect(accesGare(1540, false)).toEqual({
      dureeMarcheMin: null,
      dureeVeloMin: null,
      distance: '1,5 km',
    });
  });

  // D097 : la même règle que les gares proches, pour que la même gare ne s'affiche pas de deux façons.
  it('entre 2 et 6 km avec un parking vélo : la durée à vélo ; sans parking, aucune', () => {
    expect(accesGare(3200, true)).toEqual({
      dureeMarcheMin: null,
      dureeVeloMin: 17,
      distance: '3,2 km',
    });
    expect(accesGare(3200, false)).toEqual({
      dureeMarcheMin: null,
      dureeVeloMin: null,
      distance: '3,2 km',
    });
  });

  it('plus de 6 000 m à vélo avec le détour : la distance seule, même avec un parking', () => {
    expect(accesGare(4615, true).dureeVeloMin).toBe(24);
    expect(accesGare(4616, true)).toEqual({
      dureeMarcheMin: null,
      dureeVeloMin: null,
      distance: '4,6 km',
    });
  });
});

// Vélo (D097) : 15 km/h, détour 1,3, jusqu'à 6 000 m mesurés avec le détour, soit 4 615 m à vol d'oiseau.
describe('accesGareProche : listes de gares proches', () => {
  it('à pied jusqu’à 2 000 m à pied, même avec un parking vélo', () => {
    expect(accesGareProche(1538, false)).toEqual({ texte: '27 min à pied', aVelo: false });
    expect(accesGareProche(1538, true)).toEqual({ texte: '27 min à pied', aVelo: false });
  });

  it('au-delà, sans parking vélo : la distance seule', () => {
    expect(accesGareProche(3200, false)).toEqual({ texte: '3,2 km', aVelo: false });
  });

  it('au-delà, avec un parking vélo : la durée à vélo, jusqu’à 6 000 m avec le détour', () => {
    expect(accesGareProche(3200, true)).toEqual({ texte: '≈ 17 min à vélo', aVelo: true });
    expect(accesGareProche(4615, true)).toEqual({ texte: '≈ 24 min à vélo', aVelo: true });
  });

  it('plus de 6 000 m à vélo : la distance seule, même avec un parking', () => {
    expect(accesGareProche(4616, true)).toEqual({ texte: '4,6 km', aVelo: false });
  });
});

describe('lienItineraire : la gare seule, jamais la position (règle 5)', () => {
  const gare = { lat: 47.32319, lon: 5.02731 };

  it('Plans : la gare en destination', () => {
    const lien = new URL(lienItineraire(gare, 'plans'));
    expect(lien.origin).toBe('https://maps.apple.com');
    expect(lien.searchParams.get('daddr')).toBe('47.32319,5.02731');
    expect([...lien.searchParams.keys()]).toEqual(['daddr']);
  });

  it('Google Maps : la gare en destination', () => {
    const lien = new URL(lienItineraire(gare, 'google'));
    expect(lien.origin).toBe('https://www.google.com');
    expect(lien.pathname).toBe('/maps/dir/');
    expect(lien.searchParams.get('destination')).toBe('47.32319,5.02731');
    expect([...lien.searchParams.keys()].sort()).toEqual(['api', 'destination']);
  });
});
