import { describe, expect, it } from 'vitest';

import { debutDuWeekEnd } from './week-end';

describe('debutDuWeekEnd', () => {
  it('lundi → samedi suivant ; vendredi → lendemain (hiver, novembre 2026)', () => {
    expect(debutDuWeekEnd('2026-11-02')).toBe('2026-11-07');
    expect(debutDuWeekEnd('2026-11-06')).toBe('2026-11-07');
  });

  it('samedi → aujourd’hui ; dimanche → aujourd’hui (il ne reste que le dimanche)', () => {
    expect(debutDuWeekEnd('2026-11-07')).toBe('2026-11-07');
    expect(debutDuWeekEnd('2026-11-08')).toBe('2026-11-08');
  });

  it('été (juillet) et semaine du changement d’heure (25/10/2026)', () => {
    expect(debutDuWeekEnd('2026-07-15')).toBe('2026-07-18');
    expect(debutDuWeekEnd('2026-10-23')).toBe('2026-10-24');
    expect(debutDuWeekEnd('2026-10-25')).toBe('2026-10-25');
  });

  it('passage d’un mois et d’une année', () => {
    expect(debutDuWeekEnd('2026-12-28')).toBe('2027-01-02');
    expect(debutDuWeekEnd('2026-04-30')).toBe('2026-05-02');
  });
});
