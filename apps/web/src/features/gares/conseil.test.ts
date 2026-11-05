import { describe, expect, it } from 'vitest';
import { gareConseillee, garesAProposer } from './conseil';

const RAYON = 5000;
const gare = (uic: string, distanceM: number, nbTrainsJour: number, dansRegion = true) => ({
  uic,
  distanceM,
  nbTrainsJour,
  dansRegion,
});
const petite = gare('petite', 2700, 97);

describe('gareConseillee', () => {
  it('préfère la gare la mieux desservie à moins de 5 km, même plus loin', () => {
    const grande = gare('grande', 4000, 1035);
    expect(gareConseillee([petite, grande], RAYON)?.uic).toBe('grande');
  });
  it('accepte une gare exactement à la limite du rayon', () => {
    expect(gareConseillee([petite, gare('grande', 5000, 1035)], RAYON)?.uic).toBe('grande');
  });
  it('ignore une gare mieux desservie au-delà du rayon', () => {
    expect(gareConseillee([petite, gare('grande', 5001, 1035)], RAYON)?.uic).toBe('petite');
  });
  it('à égalité de trains, garde la plus proche', () => {
    expect(gareConseillee([petite, gare('autre', 3000, 97)], RAYON)?.uic).toBe('petite');
  });
  it('sans aucun train aujourd’hui, garde la plus proche', () => {
    const sansTrain = [gare('a', 1000, 0), gare('b', 2000, 0)];
    expect(gareConseillee(sansTrain, RAYON)?.uic).toBe('a');
  });
  it('sans gare dans le rayon, garde la plus proche', () => {
    expect(gareConseillee([gare('loin', 9000, 3), gare('plus-loin', 12000, 900)], RAYON)?.uic).toBe(
      'loin',
    );
  });
  it('préfère une gare de la région à une gare hors région mieux desservie', () => {
    const horsRegion = gare('hors', 1000, 900, false);
    expect(gareConseillee([horsRegion, petite], RAYON)?.uic).toBe('petite');
  });
  it('garde la gare hors région si aucune gare de la région n’est dans le rayon', () => {
    expect(gareConseillee([gare('hors', 1000, 900, false)], RAYON)?.uic).toBe('hors');
  });
  it('ne donne rien sans gare', () => {
    expect(gareConseillee([], RAYON)).toBeNull();
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
