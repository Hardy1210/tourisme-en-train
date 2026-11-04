import { describe, expect, it } from 'vitest';
import { lignesImpact } from './presentation';

describe('lignesImpact', () => {
  it('classe du plus sobre au plus émetteur, la plus longue barre à 100 %', () => {
    const lignes = lignesImpact({ train: 2, voitureSeule: 12, voiturePartagee: 4, avion: 20 });
    expect(lignes.map((l) => l.mode)).toEqual([
      'train',
      'voiturePartagee',
      'voitureSeule',
      'avion',
    ]);
    expect(lignes[0]?.plusSobre).toBe(true);
    expect(lignes[1]?.plusSobre).toBe(false);
    expect(lignes[3]?.largeurPct).toBe(100);
  });
  it('écarte un mode sans valeur', () => {
    const lignes = lignesImpact({ train: null, voitureSeule: 12, voiturePartagee: 4, avion: null });
    expect(lignes.map((l) => l.mode)).toEqual(['voiturePartagee', 'voitureSeule']);
  });
});
