import { describe, expect, it } from 'vitest';
import { accesGare, lienItineraire, texteAccesGare } from './acces-gare';

// Paramètres du dépôt (`acces`, D091) : marche 4,5 km/h, détour 1,3, à pied jusqu'à 2 000 m mesurés avec le
// détour, soit 1 538 m à vol d'oiseau.
describe('accesGare : trajet de l’utilisateur à sa gare de départ (D096)', () => {
  it('à 1 538 m à vol d’oiseau (2 000 m à pied) : la durée à pied', () => {
    expect(accesGare(1538)).toEqual({ dureeMarcheMin: 27, distance: '1,5 km' });
  });

  it('à 1 540 m (plus de 2 000 m à pied) : la distance seule, sans durée', () => {
    expect(accesGare(1540)).toEqual({ dureeMarcheMin: null, distance: '1,5 km' });
  });

  it('loin : la distance seule, jamais une durée à vélo', () => {
    expect(accesGare(3200)).toEqual({ dureeMarcheMin: null, distance: '3,2 km' });
  });
});

describe('texteAccesGare : listes de gares proches', () => {
  it('à pied jusqu’à 2 000 m à pied', () => {
    expect(texteAccesGare(1538)).toBe('27 min à pied');
  });

  it('au-delà : la distance seule', () => {
    expect(texteAccesGare(3200)).toBe('3,2 km');
  });
});

describe('lienItineraire : la gare seule, jamais la position (règle 5)', () => {
  const gare = { lat: 47.32319, lon: 5.02731 };

  it('sur iPhone : Plans, avec la gare en destination', () => {
    const lien = new URL(lienItineraire(gare, true));
    expect(lien.origin).toBe('https://maps.apple.com');
    expect(lien.searchParams.get('daddr')).toBe('47.32319,5.02731');
    expect([...lien.searchParams.keys()]).toEqual(['daddr']);
  });

  it('ailleurs : Google Maps, avec la gare en destination', () => {
    const lien = new URL(lienItineraire(gare, false));
    expect(lien.origin).toBe('https://www.google.com');
    expect(lien.pathname).toBe('/maps/dir/');
    expect(lien.searchParams.get('destination')).toBe('47.32319,5.02731');
    expect([...lien.searchParams.keys()].sort()).toEqual(['api', 'destination']);
  });
});
