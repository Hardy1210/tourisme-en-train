// Billet de « Votre gare » : le prochain train et la destination « vers » laquelle il va. Tests en paires.
import { describe, expect, it } from 'vitest';
import type { Destination } from '@/features/destinations/schemas';
import { billetVotreGare } from './billet-votre-gare';

const heure = (s: number, texte: string) => ({ s, texte, lendemain: false });
const destination = (titre: string, prochain: ReturnType<typeof heure> | null) =>
  ({ titre, prochainDepart: prochain }) as Destination;
const beaune = destination('Beaune', heure(36_420, '10:07'));
const dole = destination('Dole', heure(40_000, '11:06'));

describe('billetVotreGare', () => {
  it('sans destination choisie : le train qui part le plus tôt, vers sa destination', () => {
    expect(billetVotreGare(undefined, [dole, beaune], false)).toEqual({
      valeur: '10:07',
      vers: 'Beaune',
      aucun: false,
    });
  });

  it('limite : aucune destination avec un train restant, ou liste pas encore arrivée → pas de billet', () => {
    expect(billetVotreGare(undefined, [destination('Dole', null)], false)).toBeNull();
    expect(billetVotreGare(undefined, undefined, false)).toBeNull();
  });

  it('destination choisie : le prochain train vers elle, même si un autre part plus tôt', () => {
    expect(billetVotreGare(dole, [beaune, dole], false)).toEqual({
      valeur: '11:06',
      vers: 'Dole',
      aucun: false,
    });
  });

  it('limite : destination choisie sans train restant → « aucun aujourd’hui », le billet reste', () => {
    expect(billetVotreGare(destination('Dole', null), [beaune], false)).toEqual({
      valeur: 'aucun aujourd’hui'.replace('’', "'"),
      vers: 'Dole',
      aucun: true,
    });
    expect(billetVotreGare(destination('Dole', null), [beaune], true)?.valeur).toBe(
      'aucun ce jour-là',
    );
  });
});
