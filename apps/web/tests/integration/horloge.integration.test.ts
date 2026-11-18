// Horloge des tests (apps/web/tests/horloge-de-test.ts) : « aujourd'hui » ne dépend pas du jour du lancement.
import { dateDuJour, maintenantParis } from '@tourisme/commun';
import { describe, expect, it } from 'vitest';

import { INSTANT_DE_TEST } from '../instant-de-test';

describe('horloge de test', () => {
  it('aujourd’hui = 19/11/2026, à partir de 10 h (Paris)', () => {
    expect(dateDuJour()).toBe(INSTANT_DE_TEST.slice(0, 10));
    expect(maintenantParis().heureActuelleS).toBeGreaterThanOrEqual(10 * 3600);
  });

  it('limite : jamais une date de l’échantillon (15/07 et 18/11), qui restent « un autre jour »', () => {
    expect(['2026-07-15', '2026-11-18']).not.toContain(dateDuJour());
  });

  it('une date donnée explicitement n’est pas déplacée', () => {
    expect(new Date('2026-07-15T12:00:00Z').toISOString()).toBe('2026-07-15T12:00:00.000Z');
  });
});
