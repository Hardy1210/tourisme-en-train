import { describe, expect, it } from 'vitest';
import { heureEnSecondes } from '../src/chargement/liaisons';

describe('heureEnSecondes', () => {
  it('12:00 → 43 200 s (journee.arriveeMaxAller)', () => {
    expect(heureEnSecondes('12:00')).toBe(43_200);
  });

  it('00:00 → 0 s et 23:59 → 86 340 s (bornes du format HH:MM)', () => {
    expect(heureEnSecondes('00:00')).toBe(0);
    expect(heureEnSecondes('23:59')).toBe(86_340);
  });
});
