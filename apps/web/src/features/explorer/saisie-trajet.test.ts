import { describe, expect, it } from 'vitest';
import type { Destination } from '@/features/destinations/schemas';
import { resultatVerification, SAISIE_VIDE, saisieTrajet, type EtatSaisie } from './saisie-trajet';

const etat = (partiel: Partial<EtatSaisie>): EtatSaisie => ({ ...SAISIE_VIDE, ...partiel });

describe('saisieTrajet (réducteur de la page « Trajet »)', () => {
  it('saisir le départ ne touche qu’au texte du départ', () => {
    const avant = etat({ message: 'un message', verifierDepuis: 'A' });
    expect(saisieTrajet(avant, { type: 'saisirDepart', texte: 'Bea' })).toEqual({
      ...avant,
      texteDepart: 'Bea',
    });
  });
  it('saisir la destination efface le message, rien d’autre', () => {
    const avant = etat({ message: 'Pas de train direct…', texteDepart: 'x' });
    expect(saisieTrajet(avant, { type: 'saisirDestination', texte: 'Do' })).toEqual({
      ...avant,
      saisieDestination: 'Do',
      message: null,
    });
  });
  it('un départ choisi vide le champ Départ, efface le message et note la gare à revérifier', () => {
    const avant = etat({ texteDepart: 'Bea', message: 'ancien' });
    expect(saisieTrajet(avant, { type: 'departChoisi', verifierDepuis: 'A' })).toEqual(
      etat({ verifierDepuis: 'A' }),
    );
  });
  it('un départ choisi sans destination à revérifier ne note rien', () => {
    expect(saisieTrajet(SAISIE_VIDE, { type: 'departChoisi', verifierDepuis: null })).toEqual(
      SAISIE_VIDE,
    );
  });
  it('vérification faite, train direct : plus rien à revérifier, le reste est gardé', () => {
    const avant = etat({ verifierDepuis: 'A', saisieDestination: 'Dole' });
    expect(saisieTrajet(avant, { type: 'verifiee' })).toEqual({ ...avant, verifierDepuis: null });
  });
  it('vérification faite, pas de train direct : le message, et le champ Destination vidé', () => {
    const avant = etat({ verifierDepuis: 'A', saisieDestination: 'Dole' });
    expect(saisieTrajet(avant, { type: 'impossible', message: 'Pas de train' })).toEqual(
      etat({ message: 'Pas de train', saisieDestination: '' }),
    );
  });
  it('effacer la destination vide son champ, sans toucher au départ', () => {
    const avant = etat({ texteDepart: 'Bea', saisieDestination: 'Dole' });
    expect(saisieTrajet(avant, { type: 'effacerDestination' })).toEqual({
      ...avant,
      saisieDestination: '',
    });
  });
  it('à la fermeture, tout revient à l’état de départ', () => {
    const avant = etat({
      texteDepart: 'a',
      saisieDestination: 'b',
      verifierDepuis: 'C',
      message: 'd',
    });
    expect(saisieTrajet(avant, { type: 'reinitialiser' })).toEqual(SAISIE_VIDE);
  });
});

describe('resultatVerification (reste-t-il un train direct vers la destination ?)', () => {
  const vers = (uic: string, titre: string) =>
    ({
      gare: { uic, nom: titre },
      titre,
      commune: { nom: titre },
      autresGares: [],
      dureeMin: 20,
    }) as unknown as Destination;
  const liste = [vers('B', 'Beaune'), vers('D', 'Dole')];
  const dole = { recherche: 'Dole', destination: 'D' };

  it('rien à revérifier', () => {
    expect(
      resultatVerification({ verifierDepuis: null, gareActuelle: 'N', liste, recherche: dole }),
    ).toBe('aucune');
  });
  it('le nouveau départ n’est pas encore chargé : on attend', () => {
    expect(
      resultatVerification({ verifierDepuis: 'A', gareActuelle: 'A', liste, recherche: dole }),
    ).toBe('attente');
    expect(
      resultatVerification({
        verifierDepuis: 'A',
        gareActuelle: 'N',
        liste: undefined,
        recherche: dole,
      }),
    ).toBe('attente');
  });
  it('la destination est dans la liste du nouveau départ : possible', () => {
    expect(
      resultatVerification({ verifierDepuis: 'A', gareActuelle: 'N', liste, recherche: dole }),
    ).toBe('possible');
  });
  it('la destination n’y est pas : impossible', () => {
    expect(
      resultatVerification({
        verifierDepuis: 'A',
        gareActuelle: 'N',
        liste,
        recherche: { recherche: 'Paris', destination: 'P' },
      }),
    ).toBe('impossible');
  });
});
