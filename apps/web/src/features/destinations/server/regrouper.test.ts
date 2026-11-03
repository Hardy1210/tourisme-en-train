import { describe, expect, it } from 'vitest';

import { type GareAtteinte, regrouperParVille } from './regrouper';

const gare = (g: Partial<GareAtteinte> & Pick<GareAtteinte, 'gareId' | 'cleVille'>) => ({
  dansRegion: true,
  dureeMin: 30,
  nbTrains: 10,
  nbLieux: 5,
  ...g,
});

// Cas réels du 03/11 (D047), valeurs simplifiées.
const gareDeLyon = gare({
  gareId: 1,
  cleVille: 'Paris|75',
  dansRegion: false,
  dureeMin: 96,
  nbTrains: 14,
  nbLieux: 0,
});
const bercy = gare({
  gareId: 2,
  cleVille: 'Paris|75',
  dansRegion: false,
  dureeMin: 172,
  nbTrains: 6,
  nbLieux: 0,
});
const beaune = gare({ gareId: 3, cleVille: 'Beaune|21', dureeMin: 22, nbTrains: 31 });
const porteNeuve = gare({ gareId: 4, cleVille: 'Dijon|21', dureeMin: 7, nbTrains: 20 });
const velars = gare({
  gareId: 5,
  cleVille: 'Velars-sur-Ouche|21',
  dureeMin: 6,
  nbTrains: 8,
  nbLieux: 0,
});
const toutes = [bercy, gareDeLyon, beaune, porteNeuve, velars];

const options = { cleVilleDepart: 'Dijon|21', filtreEnvies: false, limite: 150 };

describe('regrouperParVille', () => {
  it('une seule destination « Paris », Gare de Lyon en tête (plus de trains), Bercy à côté', () => {
    const paris = regrouperParVille(toutes, options).find((r) => r.tete.cleVille === 'Paris|75');
    expect(paris?.tete.gareId).toBe(1);
    expect(paris?.autres.map((g) => g.gareId)).toEqual([2]);
  });

  it('le plus de trains en tête, même plus lente (Belfort devant la halte de Danjoutin)', () => {
    const danjoutin = gare({ gareId: 20, cleVille: 'Belfort|90', nbTrains: 16, dureeMin: 5 });
    const belfort = gare({ gareId: 21, cleVille: 'Belfort|90', nbTrains: 32, dureeMin: 9 });
    expect(regrouperParVille([danjoutin, belfort], options)[0]?.tete.gareId).toBe(21);
  });

  it('à égalité de trains, la plus rapide en tête', () => {
    const a = gare({ gareId: 10, cleVille: 'X|01', nbTrains: 5, dureeMin: 40 });
    const b = gare({ gareId: 11, cleVille: 'X|01', nbTrains: 5, dureeMin: 35 });
    expect(regrouperParVille([a, b], options)[0]?.tete.gareId).toBe(11);
  });

  it('même commune que le départ exclue (Dijon Porte Neuve) ; autre commune gardée', () => {
    const ids = regrouperParVille(toutes, options).map((r) => r.tete.gareId);
    expect(ids).not.toContain(4);
    expect(
      regrouperParVille(toutes, { ...options, cleVilleDepart: 'Beaune|21' }).map(
        (r) => r.tete.gareId,
      ),
    ).toContain(4);
  });

  it('aucune durée minimale : une destination à 6 min reste listée', () => {
    expect(regrouperParVille(toutes, options).map((r) => r.tete.gareId)).toContain(5);
  });

  it('tri par durée ; destination de la région sans lieu en fin de liste, pas cachée', () => {
    const liste = regrouperParVille(toutes, options);
    expect(liste.map((r) => r.tete.gareId)).toEqual([3, 1, 5]);
    expect(liste.at(-1)?.sansLieu).toBe(true);
  });

  it('hors région sans lieu : jamais « sans lieu », gardée par le filtre des envies', () => {
    const liste = regrouperParVille(toutes, { ...options, filtreEnvies: true });
    expect(liste.map((r) => r.tete.gareId)).toEqual([3, 1]);
    expect(liste.find((r) => r.tete.gareId === 1)?.sansLieu).toBe(false);
  });

  it('limite : coupe la fin de la liste, pas le début', () => {
    expect(regrouperParVille(toutes, { ...options, limite: 1 }).map((r) => r.tete.gareId)).toEqual([
      3,
    ]);
  });
});
