import { describe, expect, it } from 'vitest';
import { pageSuivante } from './pagination';

describe('pageSuivante', () => {
  it('propose une page suivante s’il reste un élément', () => {
    expect(pageSuivante(1, 30, 31)).toBe(2);
  });

  it('n’en propose pas quand la page contient le dernier élément', () => {
    expect(pageSuivante(1, 30, 30)).toBeNull();
  });

  it('n’en propose pas au-delà de la fin ni sans résultat', () => {
    expect(pageSuivante(3, 30, 31)).toBeNull();
    expect(pageSuivante(1, 30, 0)).toBeNull();
  });
});
