import { describe, expect, it } from 'vitest';
import { gareConseillee, garesAProposer } from './conseil';

const LIMITES = { distanceMaxM: 5000, ratioTrainsMin: 1.5 };
const gare = (
  uic: string,
  distanceM: number,
  trainsParDestination: number,
  dansRegion = true,
  destinations: readonly string[] = [],
) => ({ uic, distanceM, trainsParDestination, dansRegion, destinations });
const petite = gare('petite', 2700, 97);

describe('gareConseillee : aucune destination perdue', () => {
  const proche = gare('proche', 100, 87, true, ['paris', 'dijon']);

  it('remplace la plus proche si la gare mieux desservie a toutes ses destinations', () => {
    const complete = gare('complete', 2000, 500, true, ['paris', 'dijon', 'beaune']);
    expect(gareConseillee([proche, complete], LIMITES)?.uic).toBe('complete');
  });
  it('garde la plus proche s’il manque une seule destination, même avec bien plus de trains', () => {
    const incomplete = gare('incomplete', 2000, 500, true, ['dijon', 'beaune']);
    expect(gareConseillee([proche, incomplete], LIMITES)?.uic).toBe('proche');
  });
  it('ne compte pas la gare conseillée parmi les destinations à retrouver', () => {
    const porteNeuve = gare('porte-neuve', 100, 97, true, ['dijon', 'genlis']);
    const dijon = gare('dijon', 2000, 1035, true, ['porte-neuve', 'genlis', 'beaune']);
    expect(gareConseillee([porteNeuve, dijon], LIMITES)?.uic).toBe('dijon');
  });
  it('compare chaque candidate à la plus proche, et retient celle qui a le plus de trains', () => {
    const moyenne = gare('moyenne', 1000, 200, true, ['paris', 'dijon']);
    const grande = gare('grande', 3000, 900, true, ['paris', 'dijon', 'lyon']);
    const incomplete = gare('incomplete', 4000, 5000, true, ['lyon']);
    expect(gareConseillee([proche, moyenne, grande, incomplete], LIMITES)?.uic).toBe('grande');
  });
  it('à destinations égales et sans train de plus, garde la plus proche', () => {
    const jumelle = gare('jumelle', 2000, 87, true, ['paris', 'dijon']);
    expect(gareConseillee([proche, jumelle], LIMITES)?.uic).toBe('proche');
  });
});

describe('gareConseillee : assez de trains en plus', () => {
  const proche = gare('proche', 100, 100);

  it('remplace la plus proche à 1,5 fois plus de trains', () => {
    expect(gareConseillee([proche, gare('autre', 2000, 150)], LIMITES)?.uic).toBe('autre');
  });
  it('garde la plus proche juste en dessous de 1,5 fois', () => {
    expect(gareConseillee([proche, gare('autre', 2000, 149)], LIMITES)?.uic).toBe('proche');
  });
});

describe('gareConseillee', () => {
  it('préfère la gare la mieux desservie à moins de 5 km, même plus loin', () => {
    const grande = gare('grande', 4000, 1035);
    expect(gareConseillee([petite, grande], LIMITES)?.uic).toBe('grande');
  });
  it('accepte une gare exactement à la limite du rayon', () => {
    expect(gareConseillee([petite, gare('grande', 5000, 1035)], LIMITES)?.uic).toBe('grande');
  });
  it('ignore une gare mieux desservie au-delà du rayon', () => {
    expect(gareConseillee([petite, gare('grande', 5001, 1035)], LIMITES)?.uic).toBe('petite');
  });
  it('à égalité de trains, garde la plus proche', () => {
    expect(gareConseillee([petite, gare('autre', 3000, 97)], LIMITES)?.uic).toBe('petite');
  });
  it('sans aucun train aujourd’hui, garde la plus proche', () => {
    const sansTrain = [gare('a', 1000, 0), gare('b', 2000, 0)];
    expect(gareConseillee(sansTrain, LIMITES)?.uic).toBe('a');
  });
  it('sans gare dans le rayon, garde la plus proche', () => {
    expect(
      gareConseillee([gare('loin', 9000, 3), gare('plus-loin', 12000, 900)], LIMITES)?.uic,
    ).toBe('loin');
  });
  it('préfère une gare de la région à une gare hors région mieux desservie', () => {
    const horsRegion = gare('hors', 1000, 900, false);
    expect(gareConseillee([horsRegion, petite], LIMITES)?.uic).toBe('petite');
  });
  it('garde la gare hors région si aucune gare de la région n’est dans le rayon', () => {
    expect(gareConseillee([gare('hors', 1000, 900, false)], LIMITES)?.uic).toBe('hors');
  });
  it('ne donne rien sans gare', () => {
    expect(gareConseillee([], LIMITES)).toBeNull();
  });
});

describe('garesAProposer', () => {
  const a = { uic: 'a' };
  const b = { uic: 'b' };
  const c = { uic: 'c' };
  it('garde les plus proches quand la gare conseillée en fait partie', () => {
    expect(garesAProposer([a, b, c], b, 2)).toEqual([a, b]);
  });
  it('fait entrer la gare conseillée à la dernière place sinon', () => {
    expect(garesAProposer([a, b, c], c, 2)).toEqual([a, c]);
  });
});
