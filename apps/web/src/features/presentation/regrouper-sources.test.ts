import { describe, expect, it } from 'vitest';
import { regrouperSources } from './regrouper-sources';

describe('regrouperSources', () => {
  it('range les sources par thème, dans l’ordre des thèmes et sans en perdre', () => {
    const groupes = regrouperSources([
      { code: 'carte', groupe: 'carte_calculs' as const },
      { code: 'bus', groupe: 'transports' as const },
      { code: 'gares', groupe: 'trains' as const },
      { code: 'tram', groupe: 'transports' as const },
    ]);
    expect(groupes.map((g) => g.groupe)).toEqual(['trains', 'transports', 'carte_calculs']);
    expect(groupes[1]?.sources.map((s) => s.code)).toEqual(['bus', 'tram']);
  });

  it('n’affiche pas un thème sans source', () => {
    const groupes = regrouperSources([{ groupe: 'trains' as const }]);
    expect(groupes.map((g) => g.groupe)).toEqual(['trains']);
    expect(regrouperSources([])).toEqual([]);
  });
});
