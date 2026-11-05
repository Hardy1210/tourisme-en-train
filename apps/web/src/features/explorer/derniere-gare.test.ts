import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ecrireDerniereGare, lireDerniereGare } from './derniere-gare';

const gare = { uic: 'A', nom: 'Dijon', commune: null, lat: 47.3, lon: 5 };

describe('dernière gare', () => {
  beforeEach(() => {
    const valeurs = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (cle: string) => valeurs.get(cle) ?? null,
      setItem: (cle: string, valeur: string) => valeurs.set(cle, valeur),
    });
  });

  it('se relit', () => {
    ecrireDerniereGare(gare);
    expect(lireDerniereGare()).toEqual(gare);
  });
  it('n’écrit que les champs de la gare, jamais ce qui l’accompagne (règle 5)', () => {
    ecrireDerniereGare({ ...gare, distanceM: 1500, position: { lat: 1, lon: 2 } } as typeof gare);
    expect(
      Object.keys(JSON.parse(localStorage.getItem('wagoo-derniere-gare') ?? '{}')).sort(),
    ).toEqual(['commune', 'lat', 'lon', 'nom', 'uic']);
  });
  it('une valeur abîmée donne « rien », sans erreur', () => {
    localStorage.setItem('wagoo-derniere-gare', '{pas du json');
    expect(lireDerniereGare()).toBeNull();
  });
});
