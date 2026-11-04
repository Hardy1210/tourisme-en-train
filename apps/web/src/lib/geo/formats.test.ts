import { describe, expect, it } from 'vitest';
import { formaterDistance } from './formats';

describe('formaterDistance', () => {
  it('reste en mètres sous un kilomètre', () => {
    expect(formaterDistance(999)).toBe('999 m');
  });

  it('passe en kilomètres à partir de 1 000 m, avec une virgule', () => {
    expect(formaterDistance(1000)).toBe('1,0 km');
    expect(formaterDistance(6240)).toBe('6,2 km');
  });
});
